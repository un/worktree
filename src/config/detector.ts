import { execa } from 'execa'
import path from 'path'

export async function getGitRoot(cwd: string = process.cwd()): Promise<string | null> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'], { cwd })
    return stdout.trim()
  } catch {
    return null
  }
}

export async function getRepoName(gitRoot: string): Promise<string> {
  try {
    const { stdout } = await execa('git', ['remote', 'get-url', 'origin'], { cwd: gitRoot })
    const url = stdout.trim()
    
    // Extract repo name from URL
    // Handle both SSH and HTTPS URLs
    const match = url.match(/[/:]([\w-]+)\/([\w-]+?)(\.git)?$/)
    if (match) {
      return match[2]
    }
    
    // Fallback to directory name
    return path.basename(gitRoot)
  } catch {
    // If no remote, use directory name
    return path.basename(gitRoot)
  }
}

export async function isGitRepo(dir: string = process.cwd()): Promise<boolean> {
  const gitRoot = await getGitRoot(dir)
  return gitRoot !== null
}