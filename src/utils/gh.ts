import { execa } from 'execa'
import type { Worktree } from './git.js'

interface PRInfo {
  number: number
  state: string
  headRefName?: string
  updatedAt?: string
  updated_at?: string
  mergedAt?: string | null
  merged_at?: string | null
  head?: {
    ref?: string
    sha?: string
  }
}

export async function isGhInstalled(): Promise<boolean> {
  try {
    await execa('which', ['gh'])
    return true
  } catch {
    return false
  }
}

function pickBestPR(prs: PRInfo[]): PRInfo | undefined {
  return prs.sort((a, b) => {
    const aIsOpen = a.state.toUpperCase() === 'OPEN'
    const bIsOpen = b.state.toUpperCase() === 'OPEN'

    if (aIsOpen && !bIsOpen) return -1
    if (!aIsOpen && bIsOpen) return 1
    return getPRUpdatedAt(b).localeCompare(getPRUpdatedAt(a))
  })[0]
}

function getPRUpdatedAt(pr: PRInfo): string {
  return pr.updatedAt ?? pr.updated_at ?? ''
}

function getPRState(pr: PRInfo): string {
  if (isPRMerged(pr)) return 'MERGED'
  return pr.state.toUpperCase()
}

function isPRMerged(pr: PRInfo): boolean {
  return pr.state.toUpperCase() === 'MERGED' || Boolean(pr.mergedAt ?? pr.merged_at)
}

async function getPRForCommit(commit: string, gitRoot: string): Promise<PRInfo | undefined> {
  try {
    const { stdout } = await execa(
      'gh',
      [
        'api',
        `repos/:owner/:repo/commits/${commit}/pulls`,
        '--header',
        'Accept: application/vnd.github+json',
      ],
      { cwd: gitRoot },
    )

    const prs: PRInfo[] = JSON.parse(stdout)
    return pickBestPR(prs)
  } catch {
    return undefined
  }
}

async function getPRForBranch(branch: string, gitRoot: string): Promise<PRInfo | undefined> {
  try {
    const { stdout } = await execa(
      'gh',
      [
        'pr',
        'list',
        '--state',
        'all',
        '--head',
        branch,
        '--json',
        'number,headRefName,state,updatedAt,mergedAt',
        '--limit',
        '100',
      ],
      { cwd: gitRoot },
    )

    const prs: PRInfo[] = JSON.parse(stdout)
    return pickBestPR(prs)
  } catch {
    return undefined
  }
}

export async function enrichWorktreesWithPRInfo(
  worktrees: Worktree[],
  gitRoot: string,
): Promise<void> {
  if (!(await isGhInstalled())) {
    return
  }

  await Promise.all(
    worktrees.map(async (worktree) => {
      if (!worktree.branch || worktree.isMain) return

      const pr =
        (worktree.commit ? await getPRForCommit(worktree.commit, gitRoot) : undefined) ??
        (await getPRForBranch(worktree.branch, gitRoot))

      if (pr) {
        worktree.hasPR = true
        worktree.prNumber = pr.number
        worktree.prState = getPRState(pr)
        worktree.isPRMerged = isPRMerged(pr)
      }
    }),
  )
}

export async function getPRInfo(gitRoot: string): Promise<Map<string, PRInfo>> {
  const prMap = new Map<string, PRInfo>()

  if (!(await isGhInstalled())) {
    return prMap
  }

  try {
    const { stdout } = await execa(
      'gh',
      [
        'pr',
        'list',
        '--state',
        'all',
        '--json',
        'number,headRefName,state,updatedAt,mergedAt',
        '--limit',
        '500',
      ],
      { cwd: gitRoot },
    )

    const prs: PRInfo[] = JSON.parse(stdout)

    for (const pr of prs) {
      if (pr.headRefName) {
        prMap.set(pr.headRefName, pr)
      }
    }
  } catch {
    // gh might not be authenticated or repo might not have GitHub remote.
  }

  return prMap
}
