#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { program } from 'commander'
import { configCommand } from './commands/config.js'
import { createCommand } from './commands/create.js'
import { initCommand } from './commands/init.js'
import { listCommand } from './commands/list.js'
import { getGitRoot, isGitRepo } from './config/detector.js'
import { configManager } from './config/manager.js'

function getPackageVersion(): string {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { version: string }

  return packageJson.version
}

async function getGitRootOrExit(): Promise<string> {
  if (!(await isGitRepo())) {
    console.error('Error: Not in a git repository')
    process.exit(1)
  }

  const gitRoot = await getGitRoot()
  if (!gitRoot) {
    console.error('Error: Could not determine git root')
    process.exit(1)
  }

  await configManager.load()
  return gitRoot
}

async function main() {
  program
    .name('worktree')
    .description('CLI tool for managing Git worktrees for the current repository')
    .version(getPackageVersion())

  program
    .argument('[branch]', 'Branch name to create worktree for')
    .description('Create a new worktree or manage existing ones')
    .action(async (branch?: string) => {
      const gitRoot = await getGitRootOrExit()

      if (branch) {
        // Create worktree
        await createCommand(branch, gitRoot)
      } else {
        // Show only the current repository if no branch is provided
        await listCommand(gitRoot)
      }
    })

  program
    .command('list')
    .description('List and manage worktrees for the current repository')
    .action(async () => {
      const gitRoot = await getGitRootOrExit()
      await listCommand(gitRoot)
    })

  program
    .command('init')
    .description('Initialize configuration for current repository')
    .action(async () => {
      const gitRoot = await getGitRootOrExit()
      await initCommand(gitRoot)
    })

  program
    .command('config')
    .description('Manage worktree configuration')
    .action(async () => {
      const gitRoot = await getGitRootOrExit()
      await configCommand(gitRoot)
    })

  await program.parseAsync(process.argv)
}

main().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})
