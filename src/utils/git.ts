import path from 'node:path'
import { execa } from 'execa'
import fs from 'fs-extra'

export interface Worktree {
  path: string
  branch: string
  commit: string
  isMain: boolean
  isPushed?: boolean
  hasPR?: boolean
  prNumber?: number
  prState?: string
  isPRMerged?: boolean
}

async function fetchRemoteBranch(branchName: string, gitRoot: string): Promise<void> {
  await execa('git', ['fetch', 'origin', `${branchName}:refs/remotes/origin/${branchName}`], {
    cwd: gitRoot,
  })
}

async function hasLocalBranch(branchName: string, gitRoot: string): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--verify', `refs/heads/${branchName}`], { cwd: gitRoot })
    return true
  } catch {
    return false
  }
}

export async function createWorktree(
  basePath: string,
  worktreeName: string,
  branchName: string,
  gitRoot: string,
): Promise<void> {
  const worktreePath = path.join(basePath, worktreeName)

  if (!(await hasLocalBranch(branchName, gitRoot))) {
    // Branch doesn't exist locally, check remote
    try {
      await fetchRemoteBranch(branchName, gitRoot)
      await execa(
        'git',
        ['worktree', 'add', '-b', branchName, worktreePath, `origin/${branchName}`],
        {
          cwd: gitRoot,
        },
      )
      return
    } catch {
      // Create new branch
      await execa('git', ['worktree', 'add', '-b', branchName, worktreePath], { cwd: gitRoot })
      return
    }
  }

  // Branch exists locally
  await execa('git', ['worktree', 'add', worktreePath, branchName], { cwd: gitRoot })
}

export async function checkoutBranch(branchName: string, gitRoot: string): Promise<void> {
  let hasRemoteBranch = false

  try {
    await fetchRemoteBranch(branchName, gitRoot)
    hasRemoteBranch = true
  } catch {
    // The submodule may not have a same-named remote branch; fall back to local/current commit.
  }

  if (await hasLocalBranch(branchName, gitRoot)) {
    await execa('git', ['checkout', branchName], { cwd: gitRoot })

    if (hasRemoteBranch) {
      await execa('git', ['pull', '--ff-only', 'origin', branchName], { cwd: gitRoot })
    }

    return
  }

  if (hasRemoteBranch) {
    await execa('git', ['checkout', '-b', branchName, `origin/${branchName}`], { cwd: gitRoot })
    return
  }

  // Create new branch from the currently checked-out commit
  await execa('git', ['checkout', '-b', branchName], { cwd: gitRoot })
}

export async function listSubmodulePaths(gitRoot: string): Promise<string[]> {
  const gitmodulesPath = path.join(gitRoot, '.gitmodules')
  if (!(await fs.pathExists(gitmodulesPath))) {
    return []
  }

  const { stdout } = await execa(
    'git',
    ['config', '--file', '.gitmodules', '--get-regexp', 'path'],
    { cwd: gitRoot },
  )

  return stdout
    .split('\n')
    .map((line) => line.trim().match(/^[^\s]+\s+(.+)$/)?.[1])
    .filter((submodulePath): submodulePath is string => Boolean(submodulePath))
}

export async function setupSubmodulesForBranch(
  gitRoot: string,
  branchName: string,
): Promise<string[]> {
  const submodulePaths = await listSubmodulePaths(gitRoot)
  if (submodulePaths.length === 0) {
    return []
  }

  await execa('git', ['submodule', 'update', '--init', '--recursive'], { cwd: gitRoot })

  const checkedOutSubmodulePaths: string[] = []

  for (const submodulePath of submodulePaths) {
    const absoluteSubmodulePath = path.resolve(gitRoot, submodulePath)
    await checkoutBranch(branchName, absoluteSubmodulePath)
    checkedOutSubmodulePaths.push(submodulePath)

    const nestedSubmodulePaths = await setupSubmodulesForBranch(absoluteSubmodulePath, branchName)
    checkedOutSubmodulePaths.push(
      ...nestedSubmodulePaths.map((nestedSubmodulePath) =>
        path.join(submodulePath, nestedSubmodulePath),
      ),
    )
  }

  return checkedOutSubmodulePaths
}

export async function listWorktrees(gitRoot: string): Promise<Worktree[]> {
  try {
    const { stdout } = await execa('git', ['worktree', 'list', '--porcelain'], { cwd: gitRoot })

    const worktrees: Worktree[] = []
    const lines = stdout.split('\n')

    let currentWorktree: Partial<Worktree> = {}

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        if (currentWorktree.path) {
          worktrees.push(currentWorktree as Worktree)
        }
        currentWorktree = {
          path: line.substring(9),
          isMain: false,
        }
      } else if (line.startsWith('HEAD ')) {
        currentWorktree.commit = line.substring(5)
      } else if (line.startsWith('branch ')) {
        currentWorktree.branch = line.substring(7).replace('refs/heads/', '')
      } else if (line === 'bare') {
        currentWorktree.isMain = true
      } else if (line === '') {
        if (currentWorktree.path) {
          worktrees.push(currentWorktree as Worktree)
          currentWorktree = {}
        }
      }
    }

    if (currentWorktree.path) {
      worktrees.push(currentWorktree as Worktree)
    }

    // Check if branches are pushed to remote
    for (const worktree of worktrees) {
      if (!worktree.branch || worktree.isMain) continue

      try {
        await execa('git', ['rev-parse', `origin/${worktree.branch}`], { cwd: gitRoot })
        worktree.isPushed = true
      } catch {
        worktree.isPushed = false
      }
    }

    return worktrees
  } catch (error) {
    console.error('Error listing worktrees:', error)
    return []
  }
}

export async function removeWorktree(worktreePath: string, gitRoot: string): Promise<void> {
  await execa('git', ['worktree', 'remove', worktreePath, '--force'], { cwd: gitRoot })
}

export async function getAllBranches(gitRoot: string): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['branch', '-a', '--format=%(refname:short)'], {
      cwd: gitRoot,
    })
    return stdout.split('\n').filter(Boolean)
  } catch {
    return []
  }
}
