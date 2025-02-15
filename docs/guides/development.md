# Development Guide

This guide provides detailed information for developers working on the DevEnvBootstrap project.

## Development Setup

### Prerequisites

- Node.js ≥ 16.0.0
- npm ≥ 7.0.0
- Docker & Docker Compose
- Git
- TypeScript knowledge
- VS Code (recommended)

### Initial Setup

1. Clone repository:
```bash
git clone https://github.com/your-username/dev-env-bootstrap.git
cd dev-env-bootstrap
```

2. Install dependencies:
```bash
npm install
```

3. Setup development environment:
```bash
npm run setup:dev
```

4. Build project:
```bash
npm run build
```

### VS Code Configuration

1. Install recommended extensions:
   - ESLint
   - Prettier
   - TypeScript + JavaScript
   - Jest Runner
   - Docker

2. Use workspace settings:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Project Structure

```
dev-env-bootstrap/
├── src/
│   ├── analyzers/      # Project analysis
│   ├── cli/           # CLI implementation
│   ├── generators/    # Config generation
│   └── utils/         # Shared utilities
├── tests/
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   └── e2e/         # End-to-end tests
├── docs/            # Documentation
└── scripts/        # Development scripts
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Start development server
npm run dev

# Run tests while developing
npm run test:watch
```

### 2. Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Run type checks
npm run type-check

# Run tests with coverage
npm run test:coverage
```

### 3. Documentation

```bash
# Generate API documentation
npm run docs:generate

# Serve documentation locally
npm run docs:serve
```

## Debugging

### VS Code Debug Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "program": "${workspaceFolder}/src/cli/index.ts",
      "args": ["analyze", "./test-project"],
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "sourceMaps": true
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Debugging Tips

1. **CLI Debugging**
```typescript
// Add debug logs
import { logger } from '../utils/logger';
logger.debug('Variable value:', someVariable);
```

2. **Test Debugging**
```typescript
// Use test.only to focus on specific test
test.only('should handle error case', () => {
  // Test code
});
```

3. **Docker Debugging**
```bash
# View container logs
docker compose logs -f

# Access container shell
docker compose exec app sh
```

## Common Development Tasks

### 1. Adding a New Command

```typescript
// src/cli/commands/your-command.ts
import { Command } from 'commander';

export function createYourCommand(): Command {
  return new Command('your-command')
    .description('Your command description')
    .action(async () => {
      // Implementation
    });
}
```

### 2. Adding a New Analyzer

```typescript
// src/analyzers/your-analyzer.ts
export class YourAnalyzer {
  async analyze(path: string): Promise<Analysis> {
    // Implementation
  }
}
```

### 3. Adding a New Generator

```typescript
// src/generators/your-generator.ts
export class YourGenerator {
  generate(config: Config): string {
    // Implementation
  }
}
```

## Testing

### Unit Tests

```typescript
// tests/unit/your-test.ts
describe('YourClass', () => {
  let instance: YourClass;

  beforeEach(() => {
    instance = new YourClass();
  });

  it('should do something', () => {
    const result = instance.doSomething();
    expect(result).toBe(expectedValue);
  });
});
```

### Integration Tests

```typescript
// tests/integration/your-test.ts
describe('Integration', () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should work end-to-end', async () => {
    // Test code
  });
});
```

## Performance Optimization

### 1. Code Level

```typescript
// Use lazy loading
const service = await import('./service');

// Cache expensive operations
const memoizedFn = memoize(expensiveFn);

// Use streams for large files
const stream = createReadStream(file);
```

### 2. Testing Performance

```typescript
// Add performance tests
describe('Performance', () => {
  it('should complete within timeout', async () => {
    const start = Date.now();
    await operation();
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
```

## Error Handling

### Custom Error Classes

```typescript
export class CustomError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CustomError';
  }
}
```

### Error Recovery

```typescript
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof CustomError) {
    // Handle specific error
  } else {
    // Handle unknown error
  }
}
```

## Documentation

### Code Documentation

```typescript
/**
 * Performs analysis on the project
 * @param path - Project path
 * @param options - Analysis options
 * @returns Analysis results
 * @throws {AnalysisError} When analysis fails
 */
async function analyze(
  path: string,
  options?: AnalysisOptions
): Promise<Analysis> {
  // Implementation
}
```

### README Updates

- Keep examples up to date
- Document breaking changes
- Include troubleshooting tips
- Add new feature documentation

## Best Practices

1. **Code Organization**
   - One class per file
   - Consistent file naming
   - Logical folder structure

2. **Error Handling**
   - Custom error classes
   - Informative messages
   - Proper error propagation

3. **Testing**
   - High coverage
   - Meaningful assertions
   - Clean test data

4. **Performance**
   - Optimize imports
   - Cache when appropriate
   - Use streaming for large files

## See Also

- [Architecture Guide](./architecture.md)
- [Testing Guide](./testing.md)
- [Style Guide](./style.md)
