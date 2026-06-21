import path from 'node:path'
import readline from 'node:readline'
import chalk from 'chalk'
import { execa } from 'execa'
import fs from 'fs-extra'
import ora from 'ora'
import { configManager } from '../config/manager.js'
import { createWorktree, setupSubmodulesForBranch } from '../utils/git.js'
import { createWorktreeName } from '../utils/sanitize.js'
import { initCommand } from './init.js'

type DirtyWorktreeAction = 'stash-and-pop' | 'dont-pull' | 'cancel'

async function isWorktreeClean(gitRoot: string): Promise<boolean> {
  const { stdout } = await execa('git', ['status', '--porcelain'], { cwd: gitRoot })
  return stdout.trim().length === 0
}

async function promptDirtyWorktreeAction(): Promise<DirtyWorktreeAction> {
  console.log(chalk.yellow('\nLocal changes detected. Choose how to continue:'))
  console.log(chalk.cyan('  [s] stash and pop (default)'))
  console.log(chalk.cyan("  [d] don't pull remote"))
  console.log(chalk.cyan('  [c] cancel'))
  console.log(chalk.gray('Defaulting to stash and pop in 5 seconds.'))

  const answer = await new Promise<string | undefined>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    let settled = false
    const finish = (value?: string) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      rl.close()
      resolve(value)
    }

    const timeout = setTimeout(() => {
      process.stdout.write('\n')
      finish()
    }, 5000)

    rl.question('Selection: ', finish)
  })

  const normalized = (answer ?? '').trim().toLowerCase()

  if (!normalized || ['s', 'stash', 'stash and pop', 'stash-and-pop'].includes(normalized)) {
    return 'stash-and-pop'
  }

  if (['d', 'dont', "don't", 'dont pull', "don't pull", 'no pull'].includes(normalized)) {
    return 'dont-pull'
  }

  if (['c', 'cancel'].includes(normalized)) {
    return 'cancel'
  }

  console.log(chalk.yellow('Unrecognized selection; defaulting to stash and pop.'))
  return 'stash-and-pop'
}

async function pullBeforeCreatingWorktree(gitRoot: string): Promise<() => Promise<void>> {
  if (await isWorktreeClean(gitRoot)) {
    await execa('git', ['pull'], { cwd: gitRoot, stdio: 'inherit' })
    return async () => {}
  }

  const action = await promptDirtyWorktreeAction()

  if (action === 'cancel') {
    console.log(chalk.yellow('Cancelled'))
    process.exit(0)
  }

  if (action === 'dont-pull') {
    return async () => {}
  }

  await execa(
    'git',
    ['stash', 'push', '--include-untracked', '-m', 'worktree auto-stash before pull'],
    {
      cwd: gitRoot,
      stdio: 'inherit',
    },
  )
  try {
    await execa('git', ['pull'], { cwd: gitRoot, stdio: 'inherit' })
  } catch (error) {
    await execa('git', ['stash', 'pop'], { cwd: gitRoot, stdio: 'inherit' })
    throw error
  }

  return async () => {
    await execa('git', ['stash', 'pop'], { cwd: gitRoot, stdio: 'inherit' })
  }
}

export async function createCommand(branch: string, gitRoot: string): Promise<void> {
  // Check if repo is configured
  let repoConfig = await configManager.getRepoConfig(gitRoot)

  if (!repoConfig) {
    console.log(chalk.yellow('This repository is not configured yet.'))
    console.log(chalk.cyan("Let's set it up first!\n"))
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
  let popStash = async () => {}
  let failed = false

  try {
    popStash = await pullBeforeCreatingWorktree(gitRoot)

    // Create worktree
    spinner.start('Creating worktree...')
    await createWorktree(config.basePath, worktreeName, branch, gitRoot)
    spinner.succeed('Worktree created')

    spinner.start('Setting up submodules...')
    const submodulePaths = await setupSubmodulesForBranch(worktreePath, branch)
    if (submodulePaths.length > 0) {
      spinner.succeed(
        `Set up ${submodulePaths.length} submodule${submodulePaths.length === 1 ? '' : 's'}`,
      )
    } else {
      spinner.info('No submodules found')
    }

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
    console.log(chalk.cyan('✅ Ready for some epic code!'))
  } catch (error) {
    failed = true
    spinner.fail('Failed to create worktree')
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
  } finally {
    await popStash()
  }

  if (failed) {
    process.exit(1)
  }
}
