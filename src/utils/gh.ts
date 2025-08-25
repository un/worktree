import { execa } from 'execa'

interface PRInfo {
  number: number
  headRefName: string
  state: string
}

export async function isGhInstalled(): Promise<boolean> {
  try {
    await execa('which', ['gh'])
    return true
  } catch {
    return false
  }
}

export async function getPRInfo(gitRoot: string): Promise<Map<string, PRInfo>> {
  const prMap = new Map<string, PRInfo>()
  
  if (!(await isGhInstalled())) {
    return prMap
  }
  
  try {
    const { stdout } = await execa(
      'gh',
      ['pr', 'list', '--json', 'number,headRefName,state', '--limit', '100'],
      { cwd: gitRoot },
    )
    
    const prs: PRInfo[] = JSON.parse(stdout)
    
    for (const pr of prs) {
      prMap.set(pr.headRefName, pr)
    }
  } catch (error) {
    // gh might not be authenticated or repo might not have GitHub remote
    // Silently fail and return empty map
  }
  
  return prMap
}

export async function enrichWorktreesWithPRInfo(
  worktrees: Array<{ branch?: string; [key: string]: any }>,
  gitRoot: string,
): Promise<void> {
  const prInfo = await getPRInfo(gitRoot)
  
  for (const worktree of worktrees) {
    if (worktree.branch) {
      const pr = prInfo.get(worktree.branch)
      if (pr) {
        worktree.hasPR = true
        worktree.prNumber = pr.number
      }
    }
  }
}