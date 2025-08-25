import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { GlobalConfig, GlobalConfigSchema, RepoConfig } from './schema.js'

const CONFIG_PATH = path.join(os.homedir(), '.worktreerc.json')

export class ConfigManager {
  private config: GlobalConfig | null = null

  async load(): Promise<GlobalConfig> {
    if (this.config) return this.config

    try {
      const exists = await fs.pathExists(CONFIG_PATH)
      if (!exists) {
        this.config = GlobalConfigSchema.parse({})
        await this.save()
        return this.config
      }

      const data = await fs.readJson(CONFIG_PATH)
      this.config = GlobalConfigSchema.parse(data)
      return this.config
    } catch (error) {
      console.error('Error loading config:', error)
      this.config = GlobalConfigSchema.parse({})
      return this.config
    }
  }

  async save(): Promise<void> {
    if (!this.config) {
      throw new Error('No config loaded')
    }
    await fs.outputJson(CONFIG_PATH, this.config, { spaces: 2 })
  }

  async getRepoConfig(repoPath: string): Promise<RepoConfig | null> {
    const config = await this.load()
    return config.repos[repoPath] || null
  }

  async setRepoConfig(repoPath: string, repoConfig: RepoConfig): Promise<void> {
    const config = await this.load()
    config.repos[repoPath] = repoConfig
    this.config = config
    await this.save()
  }

  async removeRepoConfig(repoPath: string): Promise<void> {
    const config = await this.load()
    delete config.repos[repoPath]
    this.config = config
    await this.save()
  }

  async getAllRepoConfigs(): Promise<Record<string, RepoConfig>> {
    const config = await this.load()
    return config.repos
  }

  getEffectiveConfig(repoConfig: RepoConfig | null): {
    basePath: string
    installCommand: string
    ideCommand: string
    envPath?: string
  } {
    if (!this.config) {
      throw new Error('Config not loaded')
    }

    return {
      basePath: repoConfig?.basePath || this.config.defaultBasePath,
      installCommand: repoConfig?.installCommand || this.config.defaultInstallCommand,
      ideCommand: repoConfig?.ideCommand || this.config.defaultIdeCommand,
      envPath: repoConfig?.envPath,
    }
  }

  async updateDefaults(defaults: Partial<Pick<GlobalConfig, 'defaultBasePath' | 'defaultInstallCommand' | 'defaultIdeCommand'>>): Promise<void> {
    const config = await this.load()
    Object.assign(config, defaults)
    this.config = config
    await this.save()
  }
}

export const configManager = new ConfigManager()