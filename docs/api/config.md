# Configuration API Reference

This document details the configuration-related APIs in DevEnvBootstrap.

## ConfigManager Class

The primary class for managing configuration in DEB applications.

### Interface

```typescript
interface CliConfig {
  outputFormat: 'json' | 'table' | 'simple';
  timeout: number;
  batchSize: number;
  excludePatterns: string[];
}

interface DockerConfig {
  mode: 'development' | 'production';
  port: number;
  nodeVersion: string;
  volumes: string[];
  networks: string[];
}

class ConfigManager {
  constructor();

  // Load configuration from file
  async loadConfig(configPath?: string): Promise<CliConfig>;

  // Interactive configuration setup
  async promptConfig(defaults?: Partial<DockerConfig>): Promise<DockerConfig>;

  // Save configuration to file
  async saveConfig(projectPath: string, config: DockerConfig): Promise<void>;
}
```

### Usage Examples

#### Basic Configuration Loading
```typescript
import { ConfigManager } from 'dev-env-bootstrap';

const configManager = new ConfigManager();

// Load configuration
const config = await configManager.loadConfig('./my-project');
```

#### Interactive Configuration
```typescript
const config = await configManager.promptConfig({
  mode: 'development',
  port: 3000
});
```

#### Saving Configuration
```typescript
await configManager.saveConfig('./my-project', {
  mode: 'development',
  port: 3000,
  nodeVersion: '18-alpine',
  volumes: [],
  networks: []
});
```

## Configuration Validators

Utility class for validating configuration values.

### Interface

```typescript
class ConfigValidators {
  static validatePort(port: number): boolean;
  static validateVolumeSyntax(volume: string): boolean;
  static validateDockerConfig(config: DockerConfig): string[];
}
```

### Usage Examples

```typescript
import { ConfigValidators } from 'dev-env-bootstrap';

// Validate port
const isValidPort = ConfigValidators.validatePort(3000);

// Validate volume syntax
const isValidVolume = ConfigValidators.validateVolumeSyntax('./data:/app/data');

// Validate entire config
const errors = ConfigValidators.validateDockerConfig(config);
```

## Error Messages

Constants for configuration-related error messages.

```typescript
const ErrorMessages = {
  CONFIG_LOAD: 'Failed to load configuration file',
  CONFIG_SAVE: 'Failed to save configuration file',
  CONFIG_INVALID: 'Invalid configuration:',
  VALIDATION: {
    PORT: 'Invalid port number. Must be between 1 and 65535',
    VOLUME: 'Invalid volume mount syntax. Use format: source:target',
    MODE: 'Invalid mode. Must be either "development" or "production"'
  }
} as const;
```

## Events

Configuration-related events emitted by the system.

```typescript
configManager.on('config:load', (path: string) => {
  console.log(`Loading configuration from ${path}`);
});

configManager.on('config:save', (path: string) => {
  console.log(`Saving configuration to ${path}`);
});

configManager.on('config:validate', (errors: string[]) => {
  console.log('Configuration validation errors:', errors);
});
```

## Type Definitions

### CliConfig
```typescript
interface CliConfig {
  outputFormat: 'json' | 'table' | 'simple';
  timeout: number;
  batchSize: number;
  excludePatterns: string[];
}
```

### DockerConfig
```typescript
interface DockerConfig {
  mode: 'development' | 'production';
  port: number;
  nodeVersion: string;
  volumes: string[];
  networks: string[];
}
```

### FileSystemOptions
```typescript
interface FileSystemOptions {
  encoding?: BufferEncoding;
  ignore?: string[];
}
```

## Error Handling

The configuration API throws specific errors for various scenarios:

```typescript
class ConfigError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ConfigError';
  }
}
```

Common error scenarios:
```typescript
try {
  await configManager.loadConfig('./non-existent');
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(`Configuration error (${error.code}): ${error.message}`);
  }
}
```

## Integration Examples

### With Express.js Analysis
```typescript
import { ConfigManager, ExpressAnalyzer } from 'dev-env-bootstrap';

async function analyzeWithConfig() {
  const configManager = new ConfigManager();
  const analyzer = new ExpressAnalyzer();

  const config = await configManager.loadConfig();
  const result = await analyzer.analyze('./project', config);

  return result;
}
```

### With Docker Generation
```typescript
import { ConfigManager, ExpressDockerGenerator } from 'dev-env-bootstrap';

async function generateDocker() {
  const configManager = new ConfigManager();
  const generator = new ExpressDockerGenerator();

  const config = await configManager.loadConfig();
  const dockerfile = generator.generate(projectInfo, config);

  return dockerfile;
}
```

## Best Practices

1. Always validate configurations before using them:
```typescript
const errors = ConfigValidators.validateDockerConfig(config);
if (errors.length > 0) {
  throw new ConfigError('Invalid configuration', 'INVALID_CONFIG');
}
```

2. Use type definitions for better IDE support:
```typescript
import type { CliConfig, DockerConfig } from 'dev-env-bootstrap';
```

3. Handle configuration errors appropriately:
```typescript
try {
  await configManager.loadConfig();
} catch (error) {
  if (error instanceof ConfigError) {
    // Handle configuration errors
  } else {
    // Handle other errors
  }
}
```

## See Also

- [CLI API Reference](./cli.md)
- [Docker API Reference](./docker.md)
- [Configuration Guide](../guides/configuration.md)
