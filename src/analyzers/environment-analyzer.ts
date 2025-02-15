// src/analyzers/environment-analyzer.ts
import { FileSystemUtils } from '../utils/file-system';
import path from 'path';

export interface EnvironmentConfig {
  variables: Record<string, string>;
  hasEnvFile: boolean;
  services: {
    name: string;
    url?: string;
    required: boolean;
  }[];
}

export class EnvironmentAnalyzer {
  private fileSystem: FileSystemUtils;

  constructor() {
    this.fileSystem = new FileSystemUtils();
  }

  /**
   * Analyzes environment configuration in a project
   * @param projectPath - Path to project root
   */
  public async analyze(projectPath: string): Promise<EnvironmentConfig> {
    const result: EnvironmentConfig = {
      variables: {},
      hasEnvFile: false,
      services: []
    };

    try {
      // Check for .env file
      const envPath = path.join(projectPath, '.env');
      const envExists = await this.fileSystem.fileExists(envPath);
      result.hasEnvFile = envExists;

      if (envExists) {
        const envContent = await this.fileSystem.readFile(envPath);
        result.variables = this.parseEnvFile(envContent);
      }

      // Check for .env.example file
      const envExamplePath = path.join(projectPath, '.env.example');
      if (await this.fileSystem.fileExists(envExamplePath)) {
        const exampleContent = await this.fileSystem.readFile(envExamplePath);
        const exampleVars = this.parseEnvFile(exampleContent);
        result.services = this.detectServices(exampleVars);
      }

      return result;
    } catch (error) {
      throw new Error(`Environment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse environment file content
   */
  private parseEnvFile(content: string): Record<string, string> {
    const variables: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        variables[key.trim()] = value.trim();
      }
    }

    return variables;
  }

  /**
   * Detect services from environment variables
   */
  private detectServices(variables: Record<string, string>): EnvironmentConfig['services'] {
    const services: EnvironmentConfig['services'] = [];
    const commonServicePatterns = [
      { pattern: /DB_HOST|DATABASE_URL/, name: 'Database' },
      { pattern: /REDIS_URL|REDIS_HOST/, name: 'Redis' },
      { pattern: /MONGODB_URI|MONGO_URL/, name: 'MongoDB' },
      { pattern: /ELASTIC_URL|ELASTICSEARCH/, name: 'Elasticsearch' },
      { pattern: /RABBIT_URL|RABBITMQ/, name: 'RabbitMQ' },
      { pattern: /KAFKA_BROKERS|KAFKA_URL/, name: 'Kafka' }
    ];

    for (const [key, value] of Object.entries(variables)) {
      for (const { pattern, name } of commonServicePatterns) {
        if (pattern.test(key)) {
          services.push({
            name,
            url: value,
            required: !key.includes('OPTIONAL')
          });
          break;
        }
      }
    }

    return services;
  }
}
