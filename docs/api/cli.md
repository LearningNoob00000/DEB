# CLI API Reference

This document provides a detailed API reference for the DevEnvBootstrap CLI commands and their programmatic usage.

## Command Classes

### ProjectScanner

The main class for scanning project structure.

```typescript
class ProjectScanner {
  async scan(projectPath: string): Promise<ProjectInfo>;
}

interface ProjectInfo {
  projectType: 'express' | 'unknown';
  hasPackageJson: boolean;
  dependencies: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  projectRoot: string;
  environment?: EnvironmentConfig;
}
```

### ExpressAnalyzer

Analyzes Express.js specific project details.

```typescript
class ExpressAnalyzer {
  async analyze(projectPath: string): Promise<ExpressProjectInfo>;
}

interface ExpressProjectInfo {
  hasExpress: boolean;
  version: string | null;
  mainFile: string | null;
  port: number | null;
  middleware: string[];
  hasTypeScript: boolean;
}
```

### EnvironmentAnalyzer

Analyzes project environment configuration.

```typescript
class EnvironmentAnalyzer {
  async analyze(projectPath: string): Promise<EnvironmentConfig>;
}

interface EnvironmentConfig {
  variables: Record<string, string>;
  hasEnvFile: boolean;
  services: {
    name: string;
    url?: string;
    required: boolean;
  }[];
}
```

## Command Factory Functions

### createScanCommand

Creates the scan command instance.

```typescript
function createScanCommand(): Command;
```

Usage:
```typescript
import { createScanCommand } from 'dev-env-bootstrap';
const scanCommand = createScanCommand();
```

### createAnalyzeCommand

Creates the analyze command instance.

```typescript
function createAnalyzeCommand(): Command;
```

### createExpressCommands

Creates Express-specific command instances.

```typescript
function createExpressCommands(): Command[];
```

## CLI Instance Creation

### createCLI

Creates a new CLI instance with all commands.

```typescript
function createCLI(): Command;
```

Usage:
```typescript
import { createCLI } from 'dev-env-bootstrap';
const cli = createCLI();
cli.parse(process.argv);
```

## Programmatic Usage

### Project Scanning

```typescript
import { ProjectScanner } from 'dev-env-bootstrap';

const scanner = new ProjectScanner();
const result = await scanner.scan('./my-project');
```

### Express Analysis

```typescript
import { ExpressAnalyzer } from 'dev-env-bootstrap';

const analyzer = new ExpressAnalyzer();
const result = await analyzer.analyze('./my-express-app');
```

### Environment Analysis

```typescript
import { EnvironmentAnalyzer } from 'dev-env-bootstrap';

const analyzer = new EnvironmentAnalyzer();
const result = await analyzer.analyze('./my-project');
```

## Utility Classes

### ConfigManager

Manages CLI configuration.

```typescript
class ConfigManager {
  async loadConfig(configPath?: string): Promise<CliConfig>;
  async promptConfig(defaults?: Partial<DockerConfig>): Promise<DockerConfig>;
  async saveConfig(projectPath: string, config: DockerConfig): Promise<void>;
}
```

### FileSystemUtils

Handles file system operations.

```typescript
class FileSystemUtils {
  async readFile(filePath: string, options?: FileSystemOptions): Promise<string>;
  async writeFile(filePath: string, content: string, options?: FileSystemOptions): Promise<void>;
  async fileExists(filePath: string): Promise<boolean>;
  async findFiles(dir: string, patterns: string[], options?: FileSystemOptions): Promise<string[]>;
}
```

## Error Handling

### Error Classes

```typescript
class FileSystemError extends Error {
  constructor(message: string, public readonly path: string);
}
```

### Error Codes

The CLI uses the following error codes:
- 0: Success
- 1: General error
- 2: Invalid arguments
- 3: Configuration error

## Event System

The CLI emits events during operation:

```typescript
cli.on('scan:start', (path: string) => {});
cli.on('scan:complete', (result: ProjectInfo) => {});
cli.on('analyze:start', (path: string) => {});
cli.on('analyze:complete', (result: ExpressProjectInfo) => {});
```

## Type Definitions

Complete TypeScript type definitions are available:

```typescript
import { ProjectInfo, ExpressProjectInfo, EnvironmentConfig } from 'dev-env-bootstrap';
```

## See Also

- [Configuration Guide](../guides/configuration.md)
- [Docker Features](./docker.md)
- [Getting Started](../guides/getting-started.md)
