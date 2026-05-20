import path from 'node:path'
import { execa } from 'execa'

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

export async function createWorktree(
  basePath: string,
  worktreeName: string,
  branchName: string,
  gitRoot: string,
): Promise<void> {
  const worktreePath = path.join(basePath, worktreeName)

  // Check if branch exists
  try {
    await execa('git', ['rev-parse', '--verify', branchName], { cwd: gitRoot })
  } catch {
    // Branch doesn't exist locally, check remote
    try {
      await execa('git', ['fetch', 'origin', branchName], { cwd: gitRoot })
      await execa('git', ['worktree', 'add', worktreePath, `origin/${branchName}`], {
        cwd: gitRoot,
      })
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
