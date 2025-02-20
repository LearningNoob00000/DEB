# Testing Guide

This guide outlines the testing approach, methodologies, and best practices for the DevEnvBootstrap project.

## Testing Philosophy

DevEnvBootstrap follows a comprehensive testing strategy:
1. **Unit tests** for individual components
2. **Integration tests** for component interactions
3. **End-to-end tests** for complete workflows
4. **Performance tests** for efficiency and scalability

## Test Directory Structure

```
tests/
├── unit/                 # Unit tests
│   ├── analyzers/        # Tests for analyzer components
│   ├── generators/       # Tests for generator components
│   └── utils/            # Tests for utility functions
├── integration/          # Integration tests
│   ├── cli-workflow.test.ts
│   └── environment-docker-integration.test.ts
├── benchmarks/           # Performance tests
│   └── cli-benchmarks.test.ts
├── helpers/              # Test helpers and utilities
│   └── test-utils.ts
└── setup.ts              # Global test setup
```

## Unit Testing

### Guidelines

1. Test one component at a time
2. Mock all external dependencies
3. Focus on behavior, not implementation
4. Cover edge cases and error scenarios

### Example

```typescript
// tests/unit/analyzers/express-analyzer.test.ts
import { ExpressAnalyzer } from '../../../src/analyzers/express-analyzer';
import { FileSystemUtils } from '../../../src/utils/file-system';

jest.mock('../../../src/utils/file-system');

describe('ExpressAnalyzer', () => {
  let analyzer: ExpressAnalyzer;
  let mockFileSystem: jest.Mocked<FileSystemUtils>;

  beforeEach(() => {
    mockFileSystem = new FileSystemUtils() as jest.Mocked<FileSystemUtils>;
    (FileSystemUtils as jest.Mock).mockImplementation(() => mockFileSystem);
    analyzer = new ExpressAnalyzer();
  });

  describe('analyze', () => {
    it('should detect Express.js project with basic configuration', async () => {
      // Setup mocks
      const mockPackageJson = { dependencies: { 'express': '^4.17.1' } };
      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      // Execute
      const result = await analyzer.analyze('/fake/path');

      // Assert
      expect(result.hasExpress).toBe(true);
      expect(result.version).toBe('^4.17.1');
    });
  });
});
```

## Integration Testing

### Guidelines

1. Test how components work together
2. Minimize mocking of internal components
3. Focus on component interfaces
4. Test realistic scenarios

### Example

```typescript
// tests/integration/environment-docker-integration.test.ts
import { EnvironmentAnalyzer } from '../../src/analyzers/environment-analyzer';
import { ExpressDockerGenerator } from '../../src/generators/express-docker-generator';

describe('Environment Analyzer and Docker Generator Integration', () => {
  let analyzer: EnvironmentAnalyzer;
  let generator: ExpressDockerGenerator;

  beforeEach(() => {
    analyzer = new EnvironmentAnalyzer();
    generator = new ExpressDockerGenerator();
  });

  it('should configure MongoDB service correctly in docker-compose', async () => {
    // Setup
    const mockEnvContent = `MONGODB_URI=mongodb://localhost:27017/app`;
    mockFileSystem.readFile.mockResolvedValue(mockEnvContent);

    // Execute
    const envConfig = await analyzer.analyze('/fake/path');
    const dockerCompose = generator.generateCompose(baseProjectInfo, {
      environment: envConfig
    });

    // Assert
    expect(dockerCompose).toContain('mongodb:');
    expect(dockerCompose).toContain('image: mongo:latest');
  });
});
```

## CLI Testing

### Guidelines

1. Test command parsing
2. Test user interaction
3. Test error handling
4. Mock actual file system operations

### Example

```typescript
// tests/integration/cli-integration.test.ts
import { createCLI } from '../../src/cli';
import { Command } from 'commander';

describe('CLI Integration Tests', () => {
  let cli: Command;
  let mockConsoleLog: jest.SpyInstance;

  beforeEach(() => {
    cli = createCLI();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  it('should analyze project and output JSON when requested', async () => {
    await cli.parseAsync(['node', 'test', 'analyze', '.', '--json']);
    
    const jsonOutput = JSON.parse(mockConsoleLog.mock.calls[0][0]);
    expect(jsonOutput).toHaveProperty('projectType');
  });
});
```

## Performance Testing

### Guidelines

1. Measure execution time
2. Monitor memory usage
3. Test with large datasets
4. Run benchmarks consistently

### Example

```typescript
// tests/benchmarks/cli-benchmarks.test.ts
import { Benchmark } from '../../src/utils/benchmark';
import { ProjectScanner } from '../../src/analyzers/project-scanner';

describe('CLI Performance Benchmarks', () => {
  it('should benchmark project scanning performance', async () => {
    const scanner = new ProjectScanner();
    
    const result = await Benchmark.run(
      async () => {
        await scanner.scan('/fake/path');
      },
      {
        name: 'Project Scanner',
        iterations: 100,
        warmupIterations: 10
      }
    );

    expect(result.operationsPerSecond).toBeGreaterThan(50);
  });
});
```

## Mocking

### Guidelines

1. Use Jest mocks for external dependencies
2. Create mock factories for complex objects
3. Only mock what's necessary
4. Keep mocks simple

### Example

```typescript
// Mocking file system
jest.mock('../../src/utils/file-system');
const mockFileSystem = {
  fileExists: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue('{"name":"test"}'),
  writeFile: jest.fn().mockResolvedValue(undefined)
};
(FileSystemUtils as jest.Mock).mockImplementation(() => mockFileSystem);

// Mocking CLI input/output
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {
  throw new Error('Process.exit called');
}) as never);
```

## Test Data

### Guidelines

1. Use factory functions for test data
2. Keep test data minimal and focused
3. Clearly separate test data from assertions
4. Use descriptive names for test data

### Example

```typescript
// Test data factory
function createMockProjectInfo(overrides: Partial<ExpressProjectInfo> = {}): ExpressProjectInfo {
  return {
    hasExpress: true,
    version: '4.17.1',
    mainFile: 'index.js',
    port: 3000,
    middleware: [],
    hasTypeScript: false,
    ...overrides
  };
}

// Using test data
const projectInfo = createMockProjectInfo({ hasTypeScript: true });
```

## Error Testing

### Guidelines

1. Test expected error scenarios
2. Verify error messages and types
3. Test error recovery paths
4. Test boundary conditions

### Example

```typescript
it('should handle file not found error', async () => {
  const error = new Error('File not found');
  (error as NodeJS.ErrnoException).code = 'ENOENT';
  mockFileSystem.readFile.mockRejectedValue(error);

  await expect(fileSystem.readFile('nonexistent.txt'))
    .rejects
    .toThrow(FileSystemError);
});
```

## Test Coverage

DevEnvBootstrap aims for >80% test coverage:

```
-----------------------|---------|----------|---------|---------|-------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------------|---------|----------|---------|---------|-------------------
All files              |   82.13 |    76.31 |   88.88 |   81.99 |                   
 analyzers             |   99.35 |    89.83 |     100 |   99.34 |                   
 cli                   |     100 |      100 |     100 |     100 |                   
 cli/commands          |   62.04 |    45.76 |   76.92 |   61.58 |                   
 cli/utils             |   90.24 |       80 |   78.57 |    92.3 |                   
 generators            |   93.15 |    86.11 |    92.3 |   93.05 |                   
 utils                 |    76.8 |    79.59 |   89.47 |   76.42 |                   
-----------------------|---------|----------|---------|---------|-------------------
```

### Coverage Commands

```bash
# Run all tests with coverage
npm run test:coverage

# Generate coverage report
npm run test:coverage:report

# View coverage report
open coverage/lcov-report/index.html
```

## Continuous Integration

Tests are run automatically on CI for:
- Pull requests
- Merges to master
- Release builds

### CI Configuration

```yaml
# .github/workflows/ci.yml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm run test:coverage
```

## Best Practices

1. **Isolation**: Tests should be independent; one test should not affect another
2. **Idempotency**: Tests should produce the same results regardless of how many times they run
3. **Speed**: Tests should run quickly to support the development workflow
4. **Readability**: Tests should be easy to understand and maintain
5. **Determinism**: Tests should not have timing dependencies or race conditions

## Testing Tools

- **Jest**: Main testing framework
- **ts-jest**: TypeScript support
- **supertest**: HTTP testing
- **jest-junit**: CI reporting
- **Benchmark**: Performance testing

## See Also

- [Development Guide](./development.md)
- [Style Guide](./style.md)
- [Architecture Guide](./architecture.md)