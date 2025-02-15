# Style Guide

This guide outlines the coding standards and style conventions used in the DevEnvBootstrap project.

## Code Formatting

### General Rules

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Maximum line length of 80 characters
- Use trailing commas in multiline structures

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
};
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Naming Conventions

### Files and Directories

- Use kebab-case for file names
- Add type suffixes for specific files
- Group related files in directories

```
src/
├── analyzers/
│   ├── express-analyzer.ts
│   └── project-analyzer.ts
├── types/
│   └── express.d.ts
└── utils/
    └── file-system.ts
```

### Classes

- Use PascalCase for class names
- Add descriptive suffixes

```typescript
// Good
class ProjectAnalyzer {}
class FileSystemUtils {}
class DockerGenerator {}

// Bad
class analyzer {}
class Utils {}
class docker {}
```

### Interfaces and Types

- Use PascalCase
- Prefix interfaces with 'I' (optional)
- Use descriptive names

```typescript
// Interfaces
interface IProjectConfig {
  name: string;
  version: string;
}

// Types
type AnalysisResult = {
  type: string;
  dependencies: string[];
};

// Enums
enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}
```

### Variables and Functions

- Use camelCase
- Use descriptive names
- Avoid abbreviations

```typescript
// Variables
const userConfig = loadConfig();
const isProduction = process.env.NODE_ENV === 'production';

// Functions
async function analyzeProject(): Promise<Analysis> {}
function validateConfig(config: Config): boolean {}
```

## TypeScript Guidelines

### Type Annotations

```typescript
// Use explicit return types for functions
function getData(): Promise<Data> {}

// Use type annotations for complex objects
const config: Config = {
  port: 3000,
  env: 'development'
};

// Use generics appropriately
class Cache<T> {
  get(key: string): T | undefined {}
}
```

### Type Definitions

```typescript
// Use interfaces for object definitions
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type aliases for unions and complex types
type Status = 'pending' | 'success' | 'error';
type Handler = (data: any) => Promise<void>;

// Use enums for fixed sets of values
enum Environment {
  Development = 'development',
  Production = 'production'
}
```

### Generics

```typescript
// Use descriptive generic names
interface Repository<TEntity> {
  find(id: string): Promise<TEntity>;
  save(entity: TEntity): Promise<void>;
}

// Use constraints when necessary
function processItem<T extends BaseItem>(item: T): void {}
```

## Code Organization

### File Structure

```typescript
// imports
import { Dependencies } from './dependencies';

// interfaces/types
interface Config {}

// constants
const DEFAULT_CONFIG = {};

// class/function implementations
export class Service {
  constructor() {}

  // public methods first
  public async process(): Promise<void> {}

  // private methods last
  private validate(): boolean {}
}
```

### Module Exports

```typescript
// Single responsibility exports
export class ProjectAnalyzer {}
export interface ProjectConfig {}

// Barrel exports in index.ts
export * from './project-analyzer';
export * from './config-types';
```

## Documentation

### JSDoc Comments

```typescript
/**
 * Analyzes project structure and dependencies
 * @param path - Project root path
 * @param options - Analysis options
 * @returns Analysis results
 * @throws {AnalysisError} When analysis fails
 */
async function analyzeProject(
  path: string,
  options?: AnalysisOptions
): Promise<Analysis> {}
```

### Code Comments

```typescript
// Use comments to explain complex logic
function complexCalculation(): number {
  // First, normalize the input
  const normalized = normalize(input);

  // Then apply the transformation
  const transformed = transform(normalized);

  return transformed;
}
```

## Testing Style

### Test Structure

```typescript
describe('ServiceName', () => {
  // Setup
  let service: Service;

  beforeEach(() => {
    service = new Service();
  });

  // Test cases
  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      const input = {};

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Test Naming

```typescript
// Use descriptive test names
it('should return user when valid ID is provided', async () => {});
it('should throw error when user is not found', async () => {});
```

## Error Handling

### Error Classes

```typescript
// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error usage
// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error usage
throw new ValidationError('Invalid configuration provided');

// Error catching
try {
  await validateConfig(config);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  }
  throw error;
}
```

## Async/Await Style

### Promise Handling

```typescript
// Prefer async/await over .then()
// Good
async function getData(): Promise<Data> {
  const result = await fetchData();
  return processData(result);
}

// Avoid
function getData(): Promise<Data> {
  return fetchData()
    .then(result => processData(result));
}
```

### Error Handling

```typescript
// Use try/catch blocks
async function processData(): Promise<void> {
  try {
    const data = await fetchData();
    await saveData(data);
  } catch (error) {
    logger.error('Data processing failed:', error);
    throw error;
  }
}
```

## CLI Output Style

### Console Messages

```typescript
// Use consistent formatting for CLI output
class CliFormatter {
  success(message: string): void {
    console.log(`✅ ${message}`);
  }

  error(message: string): void {
    console.error(`❌ ${message}`);
  }

  info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  warning(message: string): void {
    console.warn(`⚠️  ${message}`);
  }
}
```

### Progress Indicators

```typescript
// Use consistent progress indicators
class ProgressIndicator {
  start(message: string): void {
    console.log(`⏳ ${message}`);
  }

  complete(message: string): void {
    console.log(`✅ ${message}`);
  }
}
```

## Configuration Style

### Configuration Objects

```typescript
// Use interface for configuration
interface ProjectConfig {
  name: string;
  version: string;
  environment: 'development' | 'production';
  server: {
    port: number;
    host: string;
  };
}

// Use default values
const DEFAULT_CONFIG: ProjectConfig = {
  name: 'project',
  version: '1.0.0',
  environment: 'development',
  server: {
    port: 3000,
    host: 'localhost'
  }
};
```

## File System Operations

### Path Handling

```typescript
// Use path.join for path concatenation
import { join } from 'path';

const configPath = join(process.cwd(), 'config.json');

// Normalize paths
import { normalize } from 'path';
const normalizedPath = normalize(rawPath);
```

## Dependency Injection

### Constructor Injection

```typescript
class Service {
  constructor(
    private readonly database: Database,
    private readonly logger: Logger
  ) {}
}

// Usage
const service = new Service(
  new Database(),
  new Logger()
);
```

## Constants and Enums

### Constant Naming

```typescript
// Use UPPER_SNAKE_CASE for constants
const DEFAULT_TIMEOUT = 3000;
const MAX_RETRIES = 3;

// Group related constants
const HTTP_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404
} as const;
```

### Enum Usage

```typescript
// Use enums for related constants
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Use const enums for better performance
const enum Direction {
  Up,
  Down,
  Left,
  Right
}
```

## Git Commit Style

### Commit Messages

```
feat(scope): add new feature
fix(scope): fix specific issue
docs(scope): update documentation
style(scope): update code style
refactor(scope): refactor code
test(scope): add or update tests
chore(scope): update build tasks
```

## Code Reviews

### Review Checklist

1. Code Style
   - Follows formatting rules
   - Uses consistent naming
   - Proper documentation

2. TypeScript
   - Proper type usage
   - No unnecessary any
   - Clear interfaces

3. Testing
   - Adequate test coverage
   - Clear test cases
   - Proper mocking

4. Error Handling
   - Proper error classes
   - Consistent error messages
   - Error recovery

## See Also

- [Architecture Guide](./architecture.md)
- [Development Guide](./development.md)
- [Testing Guide](./testing.md)
