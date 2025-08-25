import { useState } from 'react'
import { render, Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import chalk from 'chalk'
import { configManager } from '../config/manager.js'
import { getRepoName } from '../config/detector.js'
import { RepoConfig } from '../config/schema.js'

interface InitFormProps {
  gitRoot: string
  defaultName: string
  onComplete: (config: RepoConfig) => void
  onCancel?: () => void
}

function InitForm({ gitRoot, defaultName, onComplete }: InitFormProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(defaultName)
  const [prefix, setPrefix] = useState('')
  const [basePath, setBasePath] = useState('../')
  const [envPath, setEnvPath] = useState('')
  const [installCommand, setInstallCommand] = useState('')
  const [ideCommand, setIdeCommand] = useState('')

  const handleSubmit = (value: string) => {
    switch (step) {
      case 0: // Name
        setName(value || defaultName)
        setStep(1)
        break
      case 1: // Prefix
        setPrefix(value)
        setStep(2)
        break
      case 2: // Base path
        setBasePath(value || '../')
        setStep(3)
        break
      case 3: // Env path
        setEnvPath(value)
        setStep(4)
        break
      case 4: // Install command
        setInstallCommand(value)
        setStep(5)
        break
      case 5: // IDE command
        setIdeCommand(value)
        const config: RepoConfig = {
          name,
          prefix,
          basePath: basePath || undefined,
          envPath: envPath || undefined,
          installCommand: installCommand || undefined,
          ideCommand: ideCommand || undefined,
        }
        onComplete(config)
        break
    }
  }

  const fields = [
    { label: 'Repository name', value: name, placeholder: defaultName },
    { label: 'Worktree prefix (e.g., "fe-", "be-")', value: prefix, placeholder: 'prefix-' },
    { label: 'Base path for worktrees', value: basePath, placeholder: '../' },
    { label: '.env file to copy (optional)', value: envPath, placeholder: '.env.local' },
    { label: 'Install command (optional)', value: installCommand, placeholder: 'pnpm install' },
    { label: 'IDE command (optional)', value: ideCommand, placeholder: 'cursor' },
  ]

  const currentField = fields[step]

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Configure repository: {gitRoot}
      </Text>
      <Box marginY={1}>
        <Text>{currentField.label}: </Text>
        <TextInput
          value={
            step === 0 ? name :
            step === 1 ? prefix :
            step === 2 ? basePath :
            step === 3 ? envPath :
            step === 4 ? installCommand :
            ideCommand
          }
          onChange={
            step === 0 ? setName :
            step === 1 ? setPrefix :
            step === 2 ? setBasePath :
            step === 3 ? setEnvPath :
            step === 4 ? setInstallCommand :
            setIdeCommand
          }
          onSubmit={handleSubmit}
          placeholder={currentField.placeholder}
        />
      </Box>
      <Text dimColor>Press Enter to continue, Ctrl+C to cancel</Text>
    </Box>
  )
}

export async function initCommand(gitRoot: string): Promise<void> {
  const defaultName = await getRepoName(gitRoot)
  
  return new Promise((resolve) => {
    const { unmount } = render(
      <InitForm
        gitRoot={gitRoot}
        defaultName={defaultName}
        onComplete={async (config) => {
          unmount()
          await configManager.setRepoConfig(gitRoot, config)
          console.log(chalk.green(`\n✨ Repository configured successfully!`))
          console.log(chalk.gray(`Configuration saved for: ${config.name}`))
          console.log(chalk.cyan(`🚀 You're all set! Run 'worktree <branch>' to create your first worktree!`))
          resolve()
        }}
        onCancel={() => {
          unmount()
          console.log(chalk.yellow('Configuration cancelled'))
          resolve()
        }}
      />
    )
  })
}