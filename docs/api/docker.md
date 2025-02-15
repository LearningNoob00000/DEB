# Docker API Reference

This document details the Docker-related APIs in DevEnvBootstrap for generating and managing Docker configurations.

## ExpressDockerGenerator Class

The main class for generating Docker configurations for Express.js applications.

### Interface

```typescript
interface DockerConfig {
  nodeVersion: string;
  port: number;
  hasTypeScript: boolean;
  isDevelopment: boolean;
  environment?: EnvironmentConfig;
}

class ExpressDockerGenerator {
  // Generate Dockerfile content
  generate(projectInfo: ExpressProjectInfo, config: Partial<DockerConfig>): string;

  // Generate docker-compose.yml content
  generateCompose(projectInfo: ExpressProjectInfo, config: Partial<DockerConfig>): string;
}
```

### Usage Examples

#### Basic Dockerfile Generation
```typescript
import { ExpressDockerGenerator } from 'dev-env-bootstrap';

const generator = new ExpressDockerGenerator();

const dockerfile = generator.generate(projectInfo, {
  nodeVersion: '18-alpine',
  port: 3000,
  isDevelopment: true
});
```

#### Docker Compose Generation
```typescript
const dockerCompose = generator.generateCompose(projectInfo, {
  nodeVersion: '18-alpine',
  port: 3000,
  environment: {
    variables: {
      NODE_ENV: 'development'
    },
    services: [
      { name: 'Database', url: 'mongodb://localhost', required: true }
    ]
  }
});
```

## DockerConfigGenerator Class

Utility class for generating specific Docker configuration components.

### Interface

```typescript
class DockerConfigGenerator {
  generateDockerfile(config: DockerConfig): string;
  generateComposeFile(config: DockerConfig): string;
}
```

### Usage Examples

```typescript
import { DockerConfigGenerator } from 'dev-env-bootstrap';

const generator = new DockerConfigGenerator();

// Generate Dockerfile
const dockerfile = generator.generateDockerfile({
  mode: 'development',
  port: 3000,
  nodeVersion: '18-alpine',
  volumes: [],
  networks: []
});

// Generate docker-compose.yml
const compose = generator.generateComposeFile(config);
```

## Service Configuration

### Database Services

```typescript
interface DatabaseService {
  name: string;
  type: 'mongodb' | 'postgres' | 'mysql';
  version?: string;
  port?: number;
  credentials?: {
    username: string;
    password: string;
  };
}

// Usage example
const service: DatabaseService = {
  name: 'MongoDB',
  type: 'mongodb',
  version: 'latest',
  port: 27017
};
```

### Cache Services

```typescript
interface CacheService {
  name: string;
  type: 'redis' | 'memcached';
  port?: number;
}
```

### Message Queue Services

```typescript
interface MessageQueueService {
  name: string;
  type: 'rabbitmq' | 'kafka';
  port?: number;
}
```

## Multi-Stage Build Support

The Docker generator supports multi-stage builds for optimized images:

```typescript
interface MultiStageConfig extends DockerConfig {
  stages: {
    build?: boolean;
    test?: boolean;
    production?: boolean;
  };
}
```

Usage example:
```typescript
const dockerfile = generator.generate(projectInfo, {
  stages: {
    build: true,
    test: true,
    production: true
  }
});
```

## Volume Management

### Volume Configuration

```typescript
interface VolumeConfig {
  name: string;
  source: string;
  target: string;
  readonly?: boolean;
}

// Usage example
const volume: VolumeConfig = {
  name: 'data',
  source: './data',
  target: '/app/data',
  readonly: false
};
```

## Network Configuration

### Network Setup

```typescript
interface NetworkConfig {
  name: string;
  driver?: 'bridge' | 'overlay' | 'host';
  external?: boolean;
}

// Usage example
const network: NetworkConfig = {
  name: 'backend',
  driver: 'bridge'
};
```

## Environment Integration

### Environment Variables

```typescript
interface EnvironmentConfig {
  variables: Record<string, string>;
  hasEnvFile: boolean;
  services: Array<{
    name: string;
    url?: string;
    required: boolean;
  }>;
}
```

## Helper Functions

### Utility Functions

```typescript
// Check if a port is available
async function isPortAvailable(port: number): Promise<boolean>;

// Generate random ports for services
function generateServicePorts(services: string[]): Record<string, number>;

// Validate Docker compose configuration
function validateComposeConfig(config: any): string[];
```

## Events

Docker-related events emitted by the system:

```typescript
generator.on('docker:generate:start', (config: DockerConfig) => {
  console.log('Starting Docker configuration generation');
});

generator.on('docker:generate:complete', (result: string) => {
  console.log('Docker configuration generation complete');
});
```

## Error Handling

The Docker API throws specific errors:

```typescript
class DockerGenerationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DockerGenerationError';
  }
}
```

Error handling example:
```typescript
try {
  const dockerfile = await generator.generate(projectInfo, config);
} catch (error) {
  if (error instanceof DockerGenerationError) {
    console.error(`Docker generation failed: ${error.message}`);
  }
}
```

## Integration Examples

### Complete Setup Example

```typescript
import {
  ExpressDockerGenerator,
  ExpressAnalyzer,
  ConfigManager
} from 'dev-env-bootstrap';

async function setupDocker() {
  const analyzer = new ExpressAnalyzer();
  const generator = new ExpressDockerGenerator();
  const configManager = new ConfigManager();

  // Analyze project
  const projectInfo = await analyzer.analyze('./project');

  // Load configuration
  const config = await configManager.loadConfig();

  // Generate Docker files
  const dockerfile = generator.generate(projectInfo, config);
  const compose = generator.generateCompose(projectInfo, config);

  return { dockerfile, compose };
}
```

## Best Practices

1. Always validate configurations:
```typescript
const errors = validateDockerConfig(config);
if (errors.length > 0) {
  throw new DockerGenerationError('Invalid configuration');
}
```

2. Use type definitions:
```typescript
import type { DockerConfig, MultiStageConfig } from 'dev-env-bootstrap';
```

3. Handle service dependencies:
```typescript
const services = projectInfo.environment?.services || [];
for (const service of services) {
  // Add necessary service configurations
}
```

## See Also

- [CLI API Reference](./cli.md)
- [Configuration API Reference](./config.md)
- [Docker Guide](../guides/docker.md)
