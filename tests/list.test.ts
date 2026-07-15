import assert from 'node:assert/strict'
import test from 'node:test'
import { getRepoPathsToList } from '../src/commands/list.js'

const repoConfigs = {
  '/repos/current': {
    name: 'current',
  },
  '/repos/other': {
    name: 'other',
  },
}

test('bare worktree command lists only the current repository', () => {
  assert.deepEqual(getRepoPathsToList(repoConfigs, '/repos/current'), ['/repos/current'])
})

test('explicit list command lists only the current repository', () => {
  assert.deepEqual(getRepoPathsToList(repoConfigs, '/repos/current'), ['/repos/current'])
})

test('bare command in an unconfigured repository does not show unrelated repositories', () => {
  assert.deepEqual(getRepoPathsToList(repoConfigs, '/repos/unconfigured'), [])
})

test('explicit list command in an unconfigured repository does not show unrelated repositories', () => {
  assert.deepEqual(getRepoPathsToList(repoConfigs, '/repos/unconfigured'), [])
})
