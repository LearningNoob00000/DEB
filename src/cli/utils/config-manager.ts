// src/cli/utils/config-manager.ts
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemUtils } from '../../utils/file-system';

export interface DockerConfig {
  mode: 'development' | 'production';
  port: number;
  nodeVersion: string;
  volumes: string[];
  networks: string[];
}

export class ConfigManager {
  private fileSystem: FileSystemUtils;
  private static CONFIG_FILENAME = '.devenvrc.json';

  constructor() {
    this.fileSystem = new FileSystemUtils();
  }

  async loadConfig(projectPath: string): Promise<DockerConfig | null> {
    try {
      const configPath = path.join(projectPath, ConfigManager.CONFIG_FILENAME);
      const exists = await this.fileSystem.fileExists(configPath);
      if (!exists) return null;

      const content = await this.fileSystem.readFile(configPath);
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async promptConfig(defaults?: Partial<DockerConfig>): Promise<DockerConfig> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Select Docker environment mode:',
        choices: ['development', 'production'],
        default: defaults?.mode || 'development'
      },
      {
        type: 'input',
        name: 'port',
        message: 'Enter application port:',
        default: defaults?.port?.toString() || '3000',
        validate: (input: string) => !isNaN(Number(input)) || 'Please enter a valid port number'
      },
      {
        type: 'input',
        name: 'nodeVersion',
        message: 'Enter Node.js version:',
        default: defaults?.nodeVersion || '18-alpine'
      },
      {
        type: 'input',
        name: 'volumes',
        message: 'Enter volume mounts (comma-separated, e.g., ./data:/app/data):',
        default: defaults?.volumes?.join(',') || '',
        filter: (input: string) => input.split(',').filter(v => v.trim())
      }
    ]);

    return {
      ...answers,
      port: Number(answers.port),
      networks: defaults?.networks || [],
    };
  }

  async saveConfig(projectPath: string, config: DockerConfig): Promise<void> {
    try {
      const configPath = path.join(projectPath, ConfigManager.CONFIG_FILENAME);
      await this.fileSystem.writeFile(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
