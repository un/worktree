import { Box, Text, useApp, useInput } from 'ink'
import { useState } from 'react'
import type { Worktree } from '../utils/git.js'

interface WorktreeListProps {
  worktrees: Worktree[]
  repoName: string
  repoPath: string
  onDelete: (paths: string[]) => void
}

export function WorktreeList({ worktrees, repoName, repoPath, onDelete }: WorktreeListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const { exit } = useApp()

  const filteredWorktrees = worktrees.filter((w) => !w.isMain)

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1))
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(filteredWorktrees.length - 1, prev + 1))
    } else if (input === ' ') {
      const worktree = filteredWorktrees[selectedIndex]
      if (worktree) {
        const newChecked = new Set(checkedItems)
        if (newChecked.has(worktree.path)) {
          newChecked.delete(worktree.path)
        } else {
          newChecked.add(worktree.path)
        }
        setCheckedItems(newChecked)
      }
    } else if (key.return && checkedItems.size > 0) {
      onDelete(Array.from(checkedItems))
    } else if (input === 'q') {
      exit()
    }
  })

  if (filteredWorktrees.length === 0) {
    return (
      <Box flexDirection="column" marginY={1}>
        <Text color="yellow">No worktrees found for {repoName}</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" marginY={1}>
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          {repoName} ({repoPath})
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {filteredWorktrees.map((worktree, index) => (
          <Box key={worktree.path}>
            <Text color={index === selectedIndex ? 'cyan' : 'white'}>
              {index === selectedIndex ? '❯' : ' '}
            </Text>
            <Text> </Text>
            <Text>{checkedItems.has(worktree.path) ? '☑' : '☐'}</Text>
            <Text> </Text>
            <Text color={index === selectedIndex ? 'cyan' : 'white'}>
              {worktree.branch || 'detached'}
            </Text>
            {worktree.isPushed && <Text color="green"> ✓ remote</Text>}
            {worktree.hasPR && (
              <Text color={worktree.isPRMerged ? 'green' : 'magenta'}>
                {' '}
                🔀 PR #{worktree.prNumber}
                {worktree.isPRMerged ? ' (Merged)' : ''}
              </Text>
            )}
            {!worktree.isPushed && <Text color="yellow"> ⚠️ local only</Text>}
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>[Space] Select [Enter] Delete Selected ({checkedItems.size}) [Q] Quit</Text>
      </Box>
    </Box>
  )
}
