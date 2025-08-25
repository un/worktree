import { useState } from 'react'
import { render, Box, Text } from 'ink'
import chalk from 'chalk'
import { configManager } from '../config/manager.js'
import { listWorktrees, removeWorktree } from '../utils/git.js'
import { enrichWorktreesWithPRInfo } from '../utils/gh.js'
import { WorktreeList } from '../components/WorktreeList.js'

interface RepoWorktrees {
  repoPath: string
  repoName: string
  worktrees: any[]
}

function ListApp({ repos }: { repos: RepoWorktrees[] }) {
  const [currentRepoIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (paths: string[]) => {
    setIsDeleting(true)
    const currentRepo = repos[currentRepoIndex]
    
    console.log(chalk.yellow(`\n🗑️  Deleting ${paths.length} worktree${paths.length > 1 ? 's' : ''}...`))
    
    let successCount = 0
    for (const path of paths) {
      try {
        await removeWorktree(path, currentRepo.repoPath)
        successCount++
        console.log(chalk.green(`  ✓ Removed: ${path.split('/').pop()}`))
      } catch (error) {
        console.error(chalk.red(`  ✗ Failed to remove ${path}: ${error}`))
      }
    }
    
    if (successCount > 0) {
      console.log(chalk.cyan(`\n✅ Successfully deleted ${successCount} worktree${successCount > 1 ? 's' : ''}!`))
      console.log(chalk.gray(`💪 Workspace cleaned up and ready to go!`))
    }
    
    // Refresh the list after deletion
    setTimeout(() => process.exit(0), 1500)
  }

  if (repos.length === 0) {
    return (
      <Box>
        <Text color="yellow">No configured repositories found</Text>
      </Box>
    )
  }

  if (isDeleting) {
    return (
      <Box>
        <Text color="cyan">Deleting worktrees...</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      {repos.map((repo) => (
        <WorktreeList
          key={repo.repoPath}
          worktrees={repo.worktrees}
          repoName={repo.repoName}
          repoPath={repo.repoPath}
          onDelete={handleDelete}
        />
      ))}
    </Box>
  )
}

export async function listCommand(currentGitRoot: string): Promise<void> {
  const allRepoConfigs = await configManager.getAllRepoConfigs()
  const repos: RepoWorktrees[] = []

  // Add current repo first if configured
  const currentRepoConfig = allRepoConfigs[currentGitRoot]
  if (currentRepoConfig) {
    const worktrees = await listWorktrees(currentGitRoot)
    await enrichWorktreesWithPRInfo(worktrees, currentGitRoot)
    repos.push({
      repoPath: currentGitRoot,
      repoName: currentRepoConfig.name,
      worktrees,
    })
  }

  // Add other configured repos
  for (const [repoPath, config] of Object.entries(allRepoConfigs)) {
    if (repoPath === currentGitRoot) continue
    
    try {
      const worktrees = await listWorktrees(repoPath)
      await enrichWorktreesWithPRInfo(worktrees, repoPath)
      repos.push({
        repoPath,
        repoName: config.name,
        worktrees,
      })
    } catch (error) {
      // Skip repos that might have been deleted or are inaccessible
      console.warn(chalk.yellow(`Warning: Could not access ${config.name} at ${repoPath}`))
    }
  }

  if (repos.length === 0) {
    console.log(chalk.yellow('\n📦 No configured repositories found'))
    console.log(chalk.cyan('👉 Run "worktree init" to configure the current repository'))
    console.log(chalk.gray('   Then create your first worktree with "worktree <branch>"!'))
    return
  }

  render(<ListApp repos={repos} />)
}