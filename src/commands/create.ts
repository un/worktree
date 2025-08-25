import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'path'
import ora from 'ora'
import chalk from 'chalk'
import { configManager } from '../config/manager.js'
import { createWorktreeName } from '../utils/sanitize.js'
import { createWorktree } from '../utils/git.js'
import { initCommand } from './init.js'

export async function createCommand(branch: string, gitRoot: string): Promise<void> {
  // Check if repo is configured
  let repoConfig = await configManager.getRepoConfig(gitRoot)
  
  if (!repoConfig) {
    console.log(chalk.yellow('This repository is not configured yet.'))
    console.log(chalk.cyan('Let\'s set it up first!\n'))
    await initCommand(gitRoot)
    repoConfig = await configManager.getRepoConfig(gitRoot)
    
    if (!repoConfig) {
      console.error(chalk.red('Configuration cancelled'))
      process.exit(1)
    }
  }

  const config = configManager.getEffectiveConfig(repoConfig)
  const worktreeName = createWorktreeName(branch, repoConfig.prefix)
  const worktreePath = path.resolve(gitRoot, config.basePath, worktreeName)

  console.log(chalk.blue(`Creating worktree for branch: ${branch}`))
  console.log(chalk.gray(`Location: ${worktreePath}`))

  const spinner = ora()

  try {
    // Create worktree
    spinner.start('Creating worktree...')
    await createWorktree(config.basePath, worktreeName, branch, gitRoot)
    spinner.succeed('Worktree created')

    // Copy .env file if configured
    if (config.envPath) {
      spinner.start('Copying environment file...')
      const sourcePath = path.join(gitRoot, config.envPath)
      const destPath = path.join(worktreePath, config.envPath)
      
      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath)
        spinner.succeed(`Copied ${config.envPath}`)
      } else {
        spinner.warn(`Environment file ${config.envPath} not found`)
      }
    }

    // Run install command
    if (config.installCommand) {
      spinner.start(`Running: ${config.installCommand}`)
      await execa(config.installCommand, [], {
        cwd: worktreePath,
        shell: true,
        stdio: 'inherit',
      })
      spinner.succeed('Dependencies installed')
    }

    // Open IDE
    if (config.ideCommand) {
      spinner.start(`Opening in ${config.ideCommand}...`)
      await execa(config.ideCommand, [worktreePath], {
        detached: true,
        stdio: 'ignore',
      })
      spinner.succeed(`Opened in ${config.ideCommand}`)
    }

    console.log(chalk.green(`\n✨ Worktree ready at: ${worktreePath}`))
    console.log(chalk.cyan(`✅ Ready for some epic code!`))
  } catch (error) {
    spinner.fail('Failed to create worktree')
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
    process.exit(1)
  }
}