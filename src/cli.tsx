#!/usr/bin/env node
import { program } from 'commander'
import { getGitRoot, isGitRepo } from './config/detector.js'
import { configManager } from './config/manager.js'
import { createCommand } from './commands/create.js'
import { listCommand } from './commands/list.js'
import { initCommand } from './commands/init.js'
import { configCommand } from './commands/config.js'

async function main() {
  // Check if we're in a git repository
  if (!(await isGitRepo())) {
    console.error('Error: Not in a git repository')
    process.exit(1)
  }

  const gitRoot = await getGitRoot()
  if (!gitRoot) {
    console.error('Error: Could not determine git root')
    process.exit(1)
  }

  // Load config
  await configManager.load()

  program
    .name('worktree')
    .description('CLI tool for managing Git worktrees across multiple repositories')
    .version('1.0.0')

  program
    .argument('[branch]', 'Branch name to create worktree for')
    .description('Create a new worktree or manage existing ones')
    .action(async (branch?: string) => {
      if (branch) {
        // Create worktree
        await createCommand(branch, gitRoot)
      } else {
        // Show list if no branch provided
        await listCommand(gitRoot)
      }
    })

  program
    .command('list')
    .description('List and manage worktrees across all configured repositories')
    .action(async () => {
      await listCommand(gitRoot)
    })

  program
    .command('init')
    .description('Initialize configuration for current repository')
    .action(async () => {
      await initCommand(gitRoot)
    })

  program
    .command('config')
    .description('Manage worktree configuration')
    .action(async () => {
      await configCommand(gitRoot)
    })

  await program.parseAsync(process.argv)
}

main().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})