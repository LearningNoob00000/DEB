// src/cli/config.ts
import { promises as fs } from 'fs';
import path from 'path';

export interface CliConfig {
  outputFormat: 'json' | 'table' | 'simple';
  timeout: number;
  batchSize: number;
  excludePatterns: string[];
}

const DEFAULT_CONFIG: CliConfig = {
  outputFormat: 'simple',
  timeout: 30000,
  batchSize: 10,
  excludePatterns: ['node_modules', '.git']
};

export class ConfigManager {
  private config: CliConfig = DEFAULT_CONFIG;

  async loadConfig(configPath?: string): Promise<CliConfig> {
    try {
      const filePath = configPath || path.join(process.cwd(), '.devenvrc.json');
      const content = await fs.readFile(filePath, 'utf-8');
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(content) };
      return this.config;
    } catch {
      return DEFAULT_CONFIG;
    }
  }
}
