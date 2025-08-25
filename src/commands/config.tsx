import React, { useState } from 'react'
import { render, Box, Text, useInput, useApp } from 'ink'
import SelectInput from 'ink-select-input'
import TextInput from 'ink-text-input'
import chalk from 'chalk'
import { configManager } from '../config/manager.js'

type ConfigAction = 'view' | 'edit-defaults' | 'remove-repo' | 'back'

interface ConfigMenuProps {
  gitRoot: string
}

function ConfigMenu({ }: ConfigMenuProps) {
  const [action, setAction] = useState<ConfigAction | null>(null)
  const [editingDefault, setEditingDefault] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const { exit } = useApp()

  useInput((input) => {
    if (input === 'q' && !editingDefault) {
      exit()
    }
  })

  const handleSelect = (item: { value: ConfigAction }) => {
    setAction(item.value)
    if (item.value === 'back') {
      exit()
    }
  }

  const handleDefaultEdit = async (field: string, value: string) => {
    const updates: any = {}
    updates[field] = value
    await configManager.updateDefaults(updates)
    setEditingDefault(null)
    setInputValue('')
    console.log(chalk.green(`\n✅ Updated ${field} successfully!`))
    console.log(chalk.cyan(`🎯 Your new default is now active!`))
  }

  if (editingDefault) {
    return (
      <Box flexDirection="column">
        <Text>Enter new value for {editingDefault}:</Text>
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={(value) => handleDefaultEdit(editingDefault, value)}
        />
      </Box>
    )
  }

  if (action === 'view') {
    return <ConfigViewer onBack={() => setAction(null)} />
  }

  if (action === 'edit-defaults') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">Edit Default Settings</Text>
        <SelectInput
          items={[
            { label: 'Default Base Path', value: 'defaultBasePath' },
            { label: 'Default Install Command', value: 'defaultInstallCommand' },
            { label: 'Default IDE Command', value: 'defaultIdeCommand' },
            { label: 'Back', value: 'back' },
          ]}
          onSelect={(item) => {
            if (item.value === 'back') {
              setAction(null)
            } else {
              setEditingDefault(item.value)
            }
          }}
        />
      </Box>
    )
  }

  if (action === 'remove-repo') {
    return <RepoRemover onBack={() => setAction(null)} />
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Worktree Configuration</Text>
      <Box marginTop={1}>
        <SelectInput
          items={[
            { label: 'View Configuration', value: 'view' },
            { label: 'Edit Default Settings', value: 'edit-defaults' },
            { label: 'Remove Repository', value: 'remove-repo' },
            { label: 'Exit', value: 'back' },
          ]}
          onSelect={handleSelect}
        />
      </Box>
    </Box>
  )
}

function ConfigViewer({ onBack }: { onBack: () => void }) {
  const [config, setConfig] = useState<any>(null)

  React.useEffect(() => {
    configManager.load().then(setConfig)
  }, [])

  useInput((input) => {
    if (input === 'b') {
      onBack()
    }
  })

  if (!config) {
    return <Text>Loading...</Text>
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Current Configuration</Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Defaults:</Text>
        <Text>  Base Path: {config.defaultBasePath}</Text>
        <Text>  Install Command: {config.defaultInstallCommand}</Text>
        <Text>  IDE Command: {config.defaultIdeCommand}</Text>
        
        <Box marginTop={1}><Text bold>Repositories:</Text></Box>
        {Object.entries(config.repos).map(([path, repo]: [string, any]) => (
          <Box key={path} flexDirection="column" marginLeft={2}>
            <Text color="yellow">{repo.name} ({path})</Text>
            <Text>  Prefix: {repo.prefix}</Text>
            {repo.basePath && <Text>  Base Path: {repo.basePath}</Text>}
            {repo.envPath && <Text>  Env Path: {repo.envPath}</Text>}
            {repo.installCommand && <Text>  Install: {repo.installCommand}</Text>}
            {repo.ideCommand && <Text>  IDE: {repo.ideCommand}</Text>}
          </Box>
        ))}
      </Box>
      <Box marginTop={1}><Text dimColor>Press 'b' to go back</Text></Box>
    </Box>
  )
}

function RepoRemover({ onBack }: { onBack: () => void }) {
  const [repos, setRepos] = useState<Array<{ label: string; value: string }>>([])

  React.useEffect(() => {
    configManager.getAllRepoConfigs().then((configs) => {
      const items = Object.entries(configs).map(([path, config]) => ({
        label: `${config.name} (${path})`,
        value: path,
      }))
      items.push({ label: 'Cancel', value: 'cancel' })
      setRepos(items)
    })
  }, [])

  const handleSelect = async (item: { value: string }) => {
    if (item.value === 'cancel') {
      onBack()
    } else {
      await configManager.removeRepoConfig(item.value)
      console.log(chalk.green(`\n✅ Removed repository configuration`))
      console.log(chalk.cyan(`🧹 Repository config cleaned up!`))
      setTimeout(() => onBack(), 1000)
    }
  }

  if (repos.length === 0) {
    return <Text>Loading...</Text>
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Select Repository to Remove</Text>
      <SelectInput items={repos} onSelect={handleSelect} />
    </Box>
  )
}

export async function configCommand(gitRoot: string): Promise<void> {
  render(<ConfigMenu gitRoot={gitRoot} />)
}