// tests/analyzers/express-analyzer.test.ts
import { ExpressAnalyzer } from '../../src/analyzers/express-analyzer';
import { FileSystemUtils } from '../../src/utils/file-system';
import path from 'path';
import { promises as fs } from 'fs';

// Mock the FileSystemUtils class
jest.mock('../../src/utils/file-system');

describe('ExpressAnalyzer', () => {
  let analyzer: ExpressAnalyzer;
  let mockFileSystem: jest.Mocked<FileSystemUtils>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock implementation for FileSystemUtils
    mockFileSystem = {
      readFile: jest.fn(),
      fileExists: jest.fn(),
      writeFile: jest.fn(),
      ensureDir: jest.fn(),
      listFiles: jest.fn(),
      findFiles: jest.fn(),
      remove: jest.fn(),
      copy: jest.fn()
    } as unknown as jest.Mocked<FileSystemUtils>;
    
    // Make constructor return our mock
    (FileSystemUtils as jest.Mock).mockImplementation(() => mockFileSystem);
    
    analyzer = new ExpressAnalyzer();
  });

  describe('analyze', () => {
    it('should detect Express.js project with basic configuration', async () => {
      // Mock package.json with Express
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1'
        },
        main: 'index.js'
      };

      const mockIndexJs = `
        const express = require('express');
        const app = express();
        const PORT = process.env.PORT || 3000;
        
        app.listen(3000, () => {
          console.log('Server running on port 3000');
        });
      `;

      // Setup file mocks
      mockFileSystem.fileExists.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        return ['package.json', 'index.js'].includes(basename);
      });

      mockFileSystem.readFile.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        if (basename === 'package.json') {
          return JSON.stringify(mockPackageJson);
        }
        if (basename === 'index.js') {
          return mockIndexJs;
        }
        throw new Error('File not found');
      });

      // Analyze project
      const result = await analyzer.analyze('/fake/path');

      // Assert results
      expect(result.hasExpress).toBe(true);
      expect(result.version).toBe('^4.17.1');
      expect(result.mainFile).toBe('index.js');
      expect(result.port).toBe(3000);
      expect(result.middleware).toEqual([]);
      expect(result.hasTypeScript).toBe(false);
      
      // Verify that the correct paths were checked
      expect(mockFileSystem.fileExists).toHaveBeenCalledWith(expect.stringContaining('package.json'));
    });

    it('should detect TypeScript usage', async () => {
      // Mock package.json with TypeScript
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1'
        },
        devDependencies: {
          'typescript': '^4.5.4',
          '@types/express': '^4.17.13'
        },
        main: 'dist/index.js'
      };

      // Mock tsconfig.json existence
      mockFileSystem.fileExists.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        return ['package.json', 'tsconfig.json'].includes(basename);
      });

      mockFileSystem.readFile.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        if (basename === 'package.json') {
          return JSON.stringify(mockPackageJson);
        }
        throw new Error('File not found');
      });

      // Analyze project
      const result = await analyzer.analyze('/fake/path');

      // Assert results
      expect(result.hasExpress).toBe(true);
      expect(result.hasTypeScript).toBe(true);
    });

    it('should detect middleware from package.json', async () => {
      // Mock package.json with middleware
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1',
          'body-parser': '^1.19.0',
          'cors': '^2.8.5',
          'helmet': '^4.6.0',
          'morgan': '^1.10.0',
          'compression': '^1.7.4'
        },
        main: 'index.js'
      };

      mockFileSystem.fileExists.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        return basename === 'package.json';
      });

      mockFileSystem.readFile.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        if (basename === 'package.json') {
          return JSON.stringify(mockPackageJson);
        }
        throw new Error('File not found');
      });

      // Analyze project
      const result = await analyzer.analyze('/fake/path');

      // Assert results
      expect(result.hasExpress).toBe(true);
      expect(result.middleware).toContain('body-parser');
      expect(result.middleware).toContain('cors');
      expect(result.middleware).toContain('helmet');
      expect(result.middleware).toContain('morgan');
      expect(result.middleware).toContain('compression');
    });

    it('should detect port from .env file', async () => {
      // Mock package.json
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1'
        },
        main: 'index.js'
      };

      // Mock .env file
      const mockEnvContent = `
        PORT=4000
        NODE_ENV=development
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

      // Analyze project
      const result = await analyzer.analyze('/fake/path');

      // Assert results
      expect(result.hasExpress).toBe(true);
      expect(result.port).toBe(4000);
    });

    it('should detect port from main file', async () => {
      // Mock package.json
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1'
        },
        main: 'server.js'
      };

      // Mock server.js file with explicit port
      const mockServerJs = `
        const express = require('express');
        const app = express();
        
        app.listen(5000, () => {
          console.log('Server started on port 5000');
        });
      `;

      mockFileSystem.fileExists.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        return ['package.json', 'server.js'].includes(basename);
      });

      mockFileSystem.readFile.mockImplementation(async (filePath) => {
        const basename = path.basename(filePath);
        if (basename === 'package.json') {
          return JSON.stringify(mockPackageJson);
        }
        if (basename === 'server.js') {
          return mockServerJs;
        }
        throw new Error('File not found');
      });

      // Analyze project
      const result = await analyzer.analyze('/fake/path');

      // Assert results
      expect(result.hasExpress).toBe(true);
      expect(result.mainFile).toBe('server.js');
      expect(result.port).toBe(5000);
    });

    it('should handle missing package.json', async () => {
      mockFileSystem.fileExists.mockResolvedValue(false);

      // Analyze project
      const result = await analyzer.analyze('/fake/path');

      // Assert results
      expect(result.hasExpress).toBe(false);
      expect(result.version).toBeNull();
      expect(result.mainFile).toBeNull();
      expect(result.port).toBeNull();
      expect(result.middleware).toEqual([]);
      expect(result.hasTypeScript).toBe(false);
    });

    it('should handle file read errors', async () => {
      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockRejectedValue(new Error('Read error'));

      try {
        // This should throw an error
        await analyzer.analyze('/fake/path');
        fail('Expected an error to be thrown');
      } catch (error: any) { // Add type annotation here
        expect(error.message).toContain('Express analysis failed');
      }
    });
  });
});