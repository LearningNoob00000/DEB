// tests/benchmarks/cli-benchmarks.test.ts
import { Benchmark } from '../../src/utils/benchmark';
import { ProjectScanner } from '../../src/analyzers/project-scanner';
import { ExpressAnalyzer } from '../../src/analyzers/express-analyzer';
import { ExpressDockerGenerator } from '../../src/generators/express-docker-generator';
import { FileSystemUtils } from '../../src/utils/file-system';
import path from 'path';

describe('CLI Performance Benchmarks', () => {
  // Mock filesystem for consistent results
  const mockFileSystem = () => {
    const mockPackageJson = {
      dependencies: {
        'express': '^4.17.1',
        'mongodb': '^4.0.0',
        'redis': '^4.0.0',
        'amqplib': '^0.8.0'
      },
      devDependencies: {
        'typescript': '^4.5.0',
        '@types/express': '^4.17.13'
      }
    };

    const mockEnvContent = `
      PORT=3000
      MONGODB_URI=mongodb://localhost:27017/app
      REDIS_URL=redis://localhost:6379
      RABBITMQ_URL=amqp://localhost:5672
      NODE_ENV=development
      API_KEY=test-key
      DEBUG=app:*
    `;

    jest.spyOn(FileSystemUtils.prototype, 'fileExists').mockResolvedValue(true);
    jest.spyOn(FileSystemUtils.prototype, 'readFile').mockImplementation(async (filePath: string) => {
      const basename = path.basename(filePath);
      if (basename === 'package.json') return JSON.stringify(mockPackageJson);
      if (basename === '.env') return mockEnvContent;
      // For testing paths like C:\fake\path\package.json
      if (filePath.includes('package.json')) return JSON.stringify(mockPackageJson);
      if (filePath.includes('.env')) return mockEnvContent;
      if (filePath.includes('index.js')) return `
        const express = require('express');
        const app = express();
        app.listen(3000);
      `;
      return '';  // Return empty string for any other files
    });
  };

  beforeEach(() => {
    mockFileSystem();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should benchmark project scanning performance', async () => {
    const scanner = new ProjectScanner();
    const result = await Benchmark.run(
      async () => {
        await scanner.scan('/fake/path');
      },
      {
        name: 'Project Scanner',
        iterations: 1000,
        warmupIterations: 100
      }
    );

    expect(result.operationsPerSecond).toBeGreaterThan(100);
    console.log(Benchmark.formatResults(result));
  });

  it('should benchmark Express analysis performance', async () => {
    // Create an instance with mocked filesystem
    const analyzer = new ExpressAnalyzer();

    // Override the file path handling
    const result = await Benchmark.run(
      async () => {
        await analyzer.analyze('/fake/path');
      },
      {
        name: 'Express Analyzer',
        iterations: 1000,
        warmupIterations: 100
      }
    );

    expect(result.operationsPerSecond).toBeGreaterThan(200);
    console.log(Benchmark.formatResults(result));
  });

  it('should benchmark Docker configuration generation', async () => {
    const generator = new ExpressDockerGenerator();
    const scanner = new ProjectScanner();
    const projectInfo = {
      hasExpress: true,
      version: '4.17.1',
      mainFile: 'src/index.ts',
      port: 3000,
      middleware: ['body-parser', 'cors', 'helmet'],
      hasTypeScript: true
    };

    // Pre-scan for environment config
    const scanResult = await scanner.scan('/fake/path');

    const result = await Benchmark.run(
      () => {
        generator.generate(projectInfo, {
          environment: scanResult.environment,
          nodeVersion: '18-alpine',
          port: 3000,
          hasTypeScript: true,
          isDevelopment: true
        });
        generator.generateCompose(projectInfo, {
          environment: scanResult.environment,
          nodeVersion: '18-alpine',
          port: 3000,
          hasTypeScript: true,
          isDevelopment: true
        });
      },
      {
        name: 'Docker Generator',
        iterations: 1000,
        warmupIterations: 100
      }
    );

    expect(result.operationsPerSecond).toBeGreaterThan(500);
    console.log(Benchmark.formatResults(result));
  });

  it('should benchmark environment analysis performance', async () => {
  // Create a complex environment setup
  const complexEnv = Array.from({ length: 100 }, (_, i) => {
    return `SERVICE_${i}_URL=http://localhost:${8000 + i}
SERVICE_${i}_KEY=key${i}
SERVICE_${i}_SECRET=secret${i}`;
  }).join('\n');

  // Create a new mock implementation instead of reusing the original
  jest.spyOn(FileSystemUtils.prototype, 'readFile').mockImplementation(async (filePath: string) => {
    const basename = path.basename(filePath);
    if (basename === '.env' || filePath.includes('.env')) {
      return complexEnv;
    }
    if (basename === 'package.json' || filePath.includes('package.json')) {
      return JSON.stringify({
        dependencies: {
          'express': '^4.17.1'
        },
        devDependencies: {
          'typescript': '^4.5.0'
        }
      });
    }
    return '';
  });

  const analyzer = new ExpressAnalyzer();
  const result = await Benchmark.run(
    async () => {
      await analyzer.analyze('/fake/path');
    },
    {
      name: 'Environment Analysis (100 services)',
      iterations: 100,
      warmupIterations: 10
    }
  );

  expect(result.operationsPerSecond).toBeGreaterThan(50);
  console.log(Benchmark.formatResults(result));
});

  it('should benchmark full CLI workflow', async () => {
    // Use our improved mocks with the updated ExpressAnalyzer
    const scanner = new ProjectScanner();
    const analyzer = new ExpressAnalyzer();
    const generator = new ExpressDockerGenerator();

    const result = await Benchmark.run(
      async () => {
        // Simulate complete CLI workflow
        const scanResult = await scanner.scan('/fake/path');
        const expressInfo = await analyzer.analyze('/fake/path');
        
        generator.generate(expressInfo, {
          environment: scanResult.environment,
          nodeVersion: '18-alpine',
          port: 3000,
          hasTypeScript: true,
          isDevelopment: true
        });

        generator.generateCompose(expressInfo, {
          environment: scanResult.environment,
          nodeVersion: '18-alpine',
          port: 3000,
          hasTypeScript: true,
          isDevelopment: true
        });
      },
      {
        name: 'Complete CLI Workflow',
        iterations: 100,
        warmupIterations: 10
      }
    );

    expect(result.operationsPerSecond).toBeGreaterThan(25);
    console.log(Benchmark.formatResults(result));
  });

  it('should benchmark memory usage under load', async () => {
    // Create a large project setup
    const largePackageJson = {
      dependencies: Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`dep${i}`, `^1.0.${i}`])
      ),
      devDependencies: Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`devDep${i}`, `^0.1.${i}`])
      )
    };

    const largeEnv = Array.from({ length: 1000 }, (_, i) => 
      `VAR_${i}=value${i}`
    ).join('\n');

    jest.spyOn(FileSystemUtils.prototype, 'readFile').mockImplementation(async (filePath: string) => {
      const basename = path.basename(filePath);
      if (basename === 'package.json' || filePath.includes('package.json')) {
        return JSON.stringify(largePackageJson);
      }
      if (basename === '.env' || filePath.includes('.env')) {
        return largeEnv;
      }
      return '';
    });

    const scanner = new ProjectScanner();
    const result = await Benchmark.run(
      async () => {
        await scanner.scan('/fake/path');
      },
      {
        name: 'Large Project Analysis',
        iterations: 10,
        warmupIterations: 2
      }
    );

    // Verify memory usage
    expect(result.memoryUsage.heapUsed).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    console.log(Benchmark.formatResults(result));
  });
});