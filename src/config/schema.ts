import { z } from 'zod'

export const RepoConfigSchema = z.object({
  name: z.string().describe('Repository name for display'),
  prefix: z.string().describe('Prefix for worktree directories (e.g., "fe-", "be-")'),
  basePath: z.string().optional().describe('Directory to create worktrees in'),
  envPath: z.string().optional().describe('.env file to copy to new worktrees'),
  installCommand: z.string().optional().describe('Command to run after creating worktree'),
  ideCommand: z.string().optional().describe('IDE command to open worktree'),
})

export const GlobalConfigSchema = z.object({
  defaultBasePath: z.string().default('../').describe('Default directory for worktrees'),
  defaultInstallCommand: z
    .string()
    .default('pnpm install')
    .describe('Default install command'),
  defaultIdeCommand: z.string().default('cursor').describe('Default IDE command'),
  repos: z.record(z.string(), RepoConfigSchema).default({}).describe('Repository configurations'),
})

export type RepoConfig = z.infer<typeof RepoConfigSchema>
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>