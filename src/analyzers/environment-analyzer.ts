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

interface ServicePattern {
  name: string;
  pattern: RegExp;
  urlExtractor?: (value: string) => string | undefined;
}

export class EnvironmentAnalyzer {
  private fileSystem: FileSystemUtils;
  private servicePatterns: ServicePattern[] = [];

  constructor() {
    this.fileSystem = new FileSystemUtils();
    this.initializeServicePatterns();
  }

  private initializeServicePatterns() {
    this.servicePatterns = [
      {
        name: 'MongoDB',
        pattern: /MONGODB?_(?:URI|URL|HOST|PRIMARY|SECONDARY|REPLICA)/i,
        urlExtractor: (value) => value.includes('://') ? value : `mongodb://${value}`
      },
      {
        name: 'Database',
        pattern: /(POSTGRES(?:QL)?|DATABASE)_(?:URI|URL|HOST|PRIMARY|SECONDARY)/i,
        urlExtractor: (value) => value.includes('://') ? value : `postgresql://${value}`
      },
      {
        name: 'Redis',
        pattern: /REDIS_(?:URI|URL|HOST|CACHE|QUEUE)/i,
        urlExtractor: (value) => value.includes('://') ? value : `redis://${value}`
      },
      {
        name: 'RabbitMQ',
        pattern: /RABBITMQ_(?:URI|URL|HOST)/i,
        urlExtractor: (value) => value.includes('://') ? value : `amqp://${value}`
      },
      {
        name: 'Elasticsearch',
        pattern: /ELASTIC(?:SEARCH)?_(?:URI|URL|HOST)/i,
        urlExtractor: (value) => value.includes('://') ? value : `http://${value}`
      },
      {
        name: 'Kafka',
        pattern: /KAFKA_(?:BROKERS|URI|URL|HOST)/i
      }
    ];
  }

  public async analyze(projectPath: string): Promise<EnvironmentConfig> {
    try {
      const envPath = path.join(projectPath, '.env');
      const envExamplePath = path.join(projectPath, '.env.example');
      
      const result: EnvironmentConfig = {
        variables: {},
        hasEnvFile: false,
        services: []
      };

      // Check for .env file
      const envExists = await this.fileSystem.fileExists(envPath);
      result.hasEnvFile = envExists;

      if (envExists) {
        try {
          const envContent = await this.fileSystem.readFile(envPath);
          result.variables = this.parseEnvFile(envContent);
          result.services = this.detectServices(result.variables);
        } catch (error) {
          if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'EACCES') {
            throw new Error('Permission denied when reading .env file');
          }
          result.hasEnvFile = false;
          result.variables = {};
        }
      }

      // Check for .env.example file
      try {
        if (await this.fileSystem.fileExists(envExamplePath)) {
          const exampleContent = await this.fileSystem.readFile(envExamplePath);
          const exampleVars = this.parseEnvFile(exampleContent);
          const exampleServices = this.detectServices(exampleVars);
          
          // Merge services without duplicates
          const existingNames = new Set(result.services.map(s => s.name));
          const uniqueExampleServices = exampleServices.filter(s => !existingNames.has(s.name));
          result.services = [...result.services, ...uniqueExampleServices];
        }
      } catch (error) {
        // Continue if .env.example can't be read
      }

      return result;
    } catch (error) {
      throw new Error(`Environment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseEnvFile(content: string): Record<string, string> {
    const variables: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Match valid KEY=VALUE patterns with improved regex
      const match = trimmedLine.match(/^([A-Z][A-Z0-9_]*?)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        variables[key.trim()] = value.trim();
      }
    }

    return variables;
  }

  private detectServices(variables: Record<string, string>): EnvironmentConfig['services'] {
  const services: EnvironmentConfig['services'] = [];
  const serviceGroups = new Map<string, Set<string>>();

  // Process each environment variable
  for (const [key, value] of Object.entries(variables)) {
    // Check if it's optional (prefixed with OPTIONAL_)
    const isOptional = key.startsWith('OPTIONAL_');
    const serviceKey = isOptional ? key.replace('OPTIONAL_', '') : key;

    // Check against service patterns
    for (const { name, pattern, urlExtractor } of this.servicePatterns) {
      if (pattern.test(serviceKey)) {
        let serviceName = name;
        let baseKey = name;

        // Extract role identifier (PRIMARY, SECONDARY, CACHE, QUEUE)
        const roleMatch = serviceKey.match(/(PRIMARY|SECONDARY|CACHE|QUEUE|REPLICA)/i);
        let role = '';

        // Handle role identifiers
        if (roleMatch) {
          role = roleMatch[1];
          baseKey = `${name}_${role}`;
        }

        // For environment-specific configurations (DEV_, PROD_, etc.)
        const envMatch = serviceKey.match(/^(DEV_|PROD_|TEST_|STAGE_)/);
        if (envMatch) {
          serviceName = name;
          baseKey = `${envMatch[1]}${baseKey}`;
        }

        // Track service instances
        if (!serviceGroups.has(baseKey)) {
          serviceGroups.set(baseKey, new Set());
        }
        serviceGroups.get(baseKey)!.add(key);

        // Format the service name
        if (role) {
          serviceName = `${name}`;
        }

        // Handle credential information in URLs
        const serviceUrl = urlExtractor ? urlExtractor(value) : value;

        services.push({
          name: serviceName,
          url: serviceUrl ?? value,
          required: !isOptional
        });

        break;
      }
    }
  }

  return services;
}
}