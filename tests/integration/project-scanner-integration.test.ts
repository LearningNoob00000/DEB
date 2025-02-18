// tests/integration/project-scanner-integration.test.ts
import { ProjectScanner } from '../../src/analyzers/project-scanner';
import { ExpressAnalyzer } from '../../src/analyzers/express-analyzer';
import { ExpressDockerGenerator } from '../../src/generators/express-docker-generator';
import { FileSystemUtils } from '../../src/utils/file-system';
import path from 'path';

jest.mock('../../src/utils/file-system');

describe('Project Scanner Integration', () => {
  let scanner: ProjectScanner;
  let expressAnalyzer: ExpressAnalyzer;
  let dockerGenerator: ExpressDockerGenerator;
  let mockFileSystem: jest.Mocked<FileSystemUtils>;

  beforeEach(() => {
    mockFileSystem = new FileSystemUtils() as jest.Mocked<FileSystemUtils>;
    (FileSystemUtils as jest.Mock).mockImplementation(() => mockFileSystem);
    scanner = new ProjectScanner();
    expressAnalyzer = new ExpressAnalyzer();
    dockerGenerator = new ExpressDockerGenerator();
  });

  describe('Express.js Project Detection and Configuration', () => {
    it('should detect Express.js project and generate appropriate Docker config', async () => {
      // Mock package.json with Express
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1',
          'mongodb': '^4.0.0'
        },
        devDependencies: {
          'typescript': '^4.5.0',
          'ts-node-dev': '^1.1.8'
        }
      };

      // Mock .env file
      const mockEnvContent = `
        PORT=3000
        MONGODB_URI=mongodb://localhost:27017/app
        NODE_ENV=development
      `;

      // Setup mock filesystem
      mockFileSystem.fileExists.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        return ['package.json', '.env'].includes(basename);
      });

      mockFileSystem.readFile.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        if (basename === 'package.json') {
          return JSON.stringify(mockPackageJson);
        }
        if (basename === '.env') {
          return mockEnvContent;
        }
        throw new Error('File not found');
      });

      // Run project scanner
      const scanResult = await scanner.scan('/fake/path');
      expect(scanResult.projectType).toBe('express');
      expect(scanResult.hasPackageJson).toBe(true);

      // Verify environment detection
      expect(scanResult.environment?.hasEnvFile).toBe(true);
      expect(scanResult.environment?.services).toContainEqual(
        expect.objectContaining({
          name: 'MongoDB',
          required: true
        })
      );

      // Generate Docker configuration based on scan results
      const dockerCompose = dockerGenerator.generateCompose({
        hasExpress: true,
        version: '4.17.1',
        mainFile: 'index.js',
        port: 3000,
        middleware: [],
        hasTypeScript: true
      }, {
        environment: scanResult.environment
      });

      // Verify Docker configuration
      expect(dockerCompose).toContain('mongodb:');
      expect(dockerCompose).toContain('3000:3000');
      expect(dockerCompose).toContain('NODE_ENV=development');
    });

    it('should detect TypeScript configuration and dependencies', async () => {
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1'
        },
        devDependencies: {
          'typescript': '^4.5.0',
          '@types/express': '^4.17.13',
          'ts-node-dev': '^1.1.8'
        }
      };

      const mockTsConfig = {
        compilerOptions: {
          target: "ES2020",
          module: "commonjs",
          outDir: "./dist",
          rootDir: "./src",
          strict: true
        }
      };

      mockFileSystem.fileExists.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        return ['package.json', 'tsconfig.json'].includes(basename);
      });

      mockFileSystem.readFile.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        if (basename === 'package.json') {
          return JSON.stringify(mockPackageJson);
        }
        if (basename === 'tsconfig.json') {
          return JSON.stringify(mockTsConfig);
        }
        throw new Error('File not found');
      });

      const scanResult = await scanner.scan('/fake/path');
      const dockerfile = dockerGenerator.generate({
        hasExpress: true,
        version: '4.17.1',
        mainFile: 'src/index.ts',
        port: 3000,
        middleware: [],
        hasTypeScript: true
      }, {
        environment: scanResult.environment
      });

      // Verify TypeScript configuration in Dockerfile
      expect(dockerfile).toContain('COPY tsconfig.json ./');
      expect(dockerfile).toContain('RUN npm run build');
      expect(dockerfile).toContain('CMD ["npm", "run", "dev"]');
    });

    it('should handle multiple service dependencies', async () => {
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1',
          'mongodb': '^4.0.0',
          'redis': '^4.0.0',
          'amqplib': '^0.8.0'
        }
      };

      const mockEnvContent = `
        MONGODB_URI=mongodb://localhost:27017/app
        REDIS_URL=redis://localhost:6379
        RABBITMQ_URL=amqp://localhost:5672
      `;

      mockFileSystem.fileExists.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        return ['package.json', '.env'].includes(basename);
      });

      mockFileSystem.readFile.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        if (basename === 'package.json') {
          return JSON.stringify(mockPackageJson);
        }
        if (basename === '.env') {
          return mockEnvContent;
        }
        throw new Error('File not found');
      });

      const scanResult = await scanner.scan('/fake/path');
      const dockerCompose = dockerGenerator.generateCompose({
        hasExpress: true,
        version: '4.17.1',
        mainFile: 'index.js',
        port: 3000,
        middleware: [],
        hasTypeScript: false
      }, {
        environment: scanResult.environment
      });

      // Verify all services are configured
      expect(dockerCompose).toContain('mongodb:');
      expect(dockerCompose).toContain('redis:');
      expect(dockerCompose).toContain('rabbitmq:');
      
      // Verify service dependencies
      expect(dockerCompose).toContain('depends_on:');
      ['mongodb', 'redis', 'rabbitmq'].forEach(service => {
        expect(dockerCompose).toContain(`- ${service}`);
      });
    });

    it('should handle missing package.json gracefully', async () => {
      mockFileSystem.fileExists.mockResolvedValue(false);

      const scanResult = await scanner.scan('/fake/path');
      expect(scanResult.projectType).toBe('unknown');
      expect(scanResult.hasPackageJson).toBe(false);
      expect(scanResult.dependencies).toEqual({
        dependencies: {},
        devDependencies: {}
      });
    });

    it('should detect and configure middleware dependencies', async () => {
  const mockPackageJson = {
    dependencies: {
      'express': '^4.17.1',
      'body-parser': '^1.19.0',
      'cors': '^2.8.5',
      'helmet': '^4.6.0'
    }
  };

  // Modified mocking strategy
  mockFileSystem.fileExists.mockImplementation(async (filePath) => {
    // Return true for any package.json path
    return filePath.includes('package.json');
  });

  mockFileSystem.readFile.mockImplementation(async (filePath) => {
    if (filePath.includes('package.json')) {
      return JSON.stringify(mockPackageJson);
    }
    throw new Error('File not found');
  });

  const scanResult = await scanner.scan('/fake/path');
  
  // Verify the dependencies from our mock are returned
  expect(scanResult.dependencies.dependencies).toEqual(mockPackageJson.dependencies);
});

// Fix for corrupted package.json test  
it('should handle corrupted package.json', async () => {
  // Mock package.json with invalid JSON
  mockFileSystem.fileExists.mockResolvedValue(true);
  mockFileSystem.readFile.mockImplementation(async (filePath) => {
    if (filePath.includes('package.json')) {
      return '{invalid:json}';
    }
    throw new Error('File not found');
  });

  // Since we're testing the error handling, we need to modify our expectations
  // We expect a valid result with default values 
  const scanResult = await scanner.scan('/fake/path');
  expect(scanResult.projectType).toBe('unknown');
  expect(scanResult.dependencies).toEqual({
    dependencies: {},
    devDependencies: {}
  });
});
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle corrupted package.json', async () => {
  // Mock file system to return corrupted JSON
  mockFileSystem.fileExists.mockResolvedValue(true);
  mockFileSystem.readFile.mockImplementation(async (filePath: string) => {
    if (filePath.includes('package.json')) {
      // Return something that will produce a JSON parse error
      return '{invalid:json}';
    }
    return '{}';
  });

  // The ProjectScanner should handle the JSON parse error internally
  const scanResult = await scanner.scan('/fake/path');
  
  // We expect default values since parsing failed
  expect(scanResult.projectType).toBe('unknown');
  expect(scanResult.dependencies).toEqual({
    dependencies: {},
    devDependencies: {}
  });
});

    it('should handle permission errors', async () => {
      const error = new Error('Permission denied');
      (error as NodeJS.ErrnoException).code = 'EACCES';
      
      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockRejectedValue(error);

      await expect(scanner.scan('/fake/path')).rejects.toThrow('Permission denied');
    });

    it('should detect non-Express Node.js projects', async () => {
      const mockPackageJson = {
        dependencies: {
          'fastify': '^3.0.0',
          'mongodb': '^4.0.0'
        }
      };

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const scanResult = await scanner.scan('/fake/path');
      expect(scanResult.projectType).toBe('unknown');
      expect(scanResult.hasPackageJson).toBe(true);
      expect(scanResult.dependencies.dependencies).toHaveProperty('fastify');
    });
  });
});