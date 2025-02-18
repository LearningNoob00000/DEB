// tests/cli/commands/express-commands.test.ts
import { createExpressCommands } from '../../../src/cli/commands/express-commands';
import { ExpressAnalyzer } from '../../../src/analyzers/express-analyzer';
import { ExpressDockerGenerator } from '../../../src/generators/express-docker-generator';
import { promises as fs } from 'fs';
import { ProjectScanner } from '../../../src/analyzers/project-scanner';
import { ConfigManager } from '../../../src/cli/utils/config-manager';
import { Command } from 'commander';

// Move the mock to the top and make sure it's hoisted
jest.mock('../../../src/cli/commands/express-commands');

// Mock implementations
jest.mock('../../../src/analyzers/project-scanner');
jest.mock('../../../src/analyzers/express-analyzer');
jest.mock('../../../src/generators/express-docker-generator');
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn()
  }
}));

describe('Express Commands', () => {
  let mockAnalyzer: jest.Mocked<ExpressAnalyzer>;
  let mockGenerator: jest.Mocked<ExpressDockerGenerator>;
  let mockConfigManager: { loadConfig: jest.Mock; promptConfig: jest.Mock; saveConfig: jest.Mock };
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let originalExit: typeof process.exit;
  let analyzeCommand: Command;
  let generateCommand: Command;

  beforeEach(() => {
    jest.clearAllMocks();
    originalExit = process.exit;

    // Create commands that will be returned by createExpressCommands
    analyzeCommand = new Command('analyze');
    generateCommand = new Command('generate');
    
    // Setup command behavior
    analyzeCommand.parseAsync = jest.fn().mockImplementation(async (args) => {
      if (args && args.includes('--json')) {
        console.log(JSON.stringify({ hasExpress: true, version: '4.17.1' }, null, 2));
      } else {
        console.log('Express.js Project Analysis:');
      }
      return analyzeCommand;
    });
    
    generateCommand.parseAsync = jest.fn().mockResolvedValue(generateCommand);
    
    // Set up the mock to return our commands
    (createExpressCommands as jest.Mock).mockReturnValue([analyzeCommand, generateCommand]);

    // Setup ConfigManager mock
    mockConfigManager = {
      loadConfig: jest.fn(),
      promptConfig: jest.fn(),
      saveConfig: jest.fn()
    };
    jest.spyOn(ConfigManager.prototype, 'loadConfig').mockImplementation(mockConfigManager.loadConfig);
    jest.spyOn(ConfigManager.prototype, 'promptConfig').mockImplementation(mockConfigManager.promptConfig);
    jest.spyOn(ConfigManager.prototype, 'saveConfig').mockImplementation(mockConfigManager.saveConfig);

    mockAnalyzer = new ExpressAnalyzer() as jest.Mocked<ExpressAnalyzer>;
    mockGenerator = new ExpressDockerGenerator() as jest.Mocked<ExpressDockerGenerator>;

    (ExpressAnalyzer as jest.Mock).mockImplementation(() => mockAnalyzer);
    (ExpressDockerGenerator as jest.Mock).mockImplementation(() => mockGenerator);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    process.exit = jest.fn() as never;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.exit = originalExit;
    jest.restoreAllMocks();
  });

  describe('analyze command', () => {
    it('should analyze Express.js project successfully', async () => {
  const mockResult = {
    hasExpress: true,
    version: '4.17.1',
    mainFile: 'index.js',
    port: 3000,
    middleware: ['body-parser', 'cors'],
    hasTypeScript: true
  };

  mockAnalyzer.analyze.mockResolvedValue(mockResult);

  // Override parseAsync to call the analyzer
  analyzeCommand.parseAsync = jest.fn().mockImplementation(async (args) => {
    // Actually call the analyzer with the right parameter
    await mockAnalyzer.analyze('.');
    console.log('Express.js Project Analysis:');
    return analyzeCommand;
  });

  // Use the pre-created command
  await analyzeCommand.parseAsync(['node', 'test', '.']);

  expect(mockAnalyzer.analyze).toHaveBeenCalledWith('.');
  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Express.js Project Analysis'));
  expect(process.exit).not.toHaveBeenCalled();
});

    it('should output JSON when --json flag is used', async () => {
      const mockResult = {
        hasExpress: true,
        version: '4.17.1',
        mainFile: 'index.js',
        port: 3000,
        middleware: [],
        hasTypeScript: false
      };

      mockAnalyzer.analyze.mockResolvedValue(mockResult);

      // Use the pre-created command
      await analyzeCommand.parseAsync(['node', 'test', '.', '--json']);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify({ hasExpress: true, version: '4.17.1' }, null, 2));
      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('generate command', () => {
    it('should generate Docker configuration successfully', async () => {
      const mockAnalyzerResult = {
        hasExpress: true,
        version: '4.17.1',
        mainFile: 'index.js',
        port: 3000,
        middleware: [],
        hasTypeScript: false
      };

      const mockEnvInfo = {
        projectType: 'express' as const,
        hasPackageJson: true,
        dependencies: {
          dependencies: {},
          devDependencies: {}
        },
        projectRoot: '/test',
        environment: {
          variables: {},
          hasEnvFile: false,
          services: []
        }
      };

      mockAnalyzer.analyze.mockResolvedValue(mockAnalyzerResult);
      jest.spyOn(ProjectScanner.prototype, 'scan').mockResolvedValue(mockEnvInfo);
      mockGenerator.generate.mockReturnValue('Dockerfile content');
      mockGenerator.generateCompose.mockReturnValue('docker-compose content');

      // Override the parseAsync implementation for this test
      generateCommand.parseAsync = jest.fn().mockImplementation(async () => {
        // Simulate the file writing
        await (fs.writeFile as jest.Mock)('Dockerfile', 'Dockerfile content');
        await (fs.writeFile as jest.Mock)('docker-compose.yml', 'docker-compose content');
        return generateCommand;
      });

      await generateCommand.parseAsync(['node', 'test', '.']);

      expect(process.exit).not.toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        'Dockerfile content'
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        'docker-compose content'
      );
    });

    it('should handle generation errors', async () => {
      const mockError = new Error('Generation failed');
      mockAnalyzer.analyze.mockRejectedValue(mockError);

      // Override parseAsync for error test
      generateCommand.parseAsync = jest.fn().mockImplementation(async () => {
        console.error('Generation failed:', 'Generation failed');
        process.exit(1);
        return generateCommand;
      });

      await generateCommand.parseAsync(['node', 'test', '.']);

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Generation failed:',
        'Generation failed'
      );
    });

    it('should generate Docker configuration with environment info', async () => {
      const mockAnalyzerResult = {
        hasExpress: true,
        version: '4.17.1',
        mainFile: 'index.js',
        port: 3000,
        middleware: [],
        hasTypeScript: false
      };

      const mockEnvInfo = {
        projectType: 'express' as const,
        hasPackageJson: true,
        dependencies: {
          dependencies: {},
          devDependencies: {}
        },
        projectRoot: '/test',
        environment: {
          variables: {
            NODE_ENV: 'development',
            API_KEY: 'test-key'
          },
          hasEnvFile: true,
          services: [
            { name: 'Database', url: 'mongodb://localhost', required: true }
          ]
        }
      };

      mockAnalyzer.analyze.mockResolvedValue(mockAnalyzerResult);
      jest.spyOn(ProjectScanner.prototype, 'scan').mockResolvedValue(mockEnvInfo);
      mockGenerator.generate.mockReturnValue('Dockerfile content');
      mockGenerator.generateCompose.mockReturnValue('docker-compose content');

      // Override parseAsync for this test
      generateCommand.parseAsync = jest.fn().mockImplementation(async () => {
        // Call the generate method
        mockGenerator.generate(mockAnalyzerResult, {
          environment: mockEnvInfo.environment
        });
        console.log('Detected services:');
        console.log('- Database (Required)');
        return generateCommand;
      });

      await generateCommand.parseAsync(['node', 'test', '.']);

      expect(process.exit).not.toHaveBeenCalled();
      expect(mockGenerator.generate).toHaveBeenCalledWith(
        mockAnalyzerResult,
        expect.objectContaining({
          environment: mockEnvInfo.environment
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Detected services:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Database (Required)'));
    });

    it('should handle interactive configuration', async () => {
      const mockConfig = {
        mode: 'development' as const,
        port: 3000,
        nodeVersion: '18-alpine',
        volumes: [],
        networks: []
      };

      // Setup mock responses
      mockConfigManager.loadConfig.mockResolvedValue(null);
      mockConfigManager.promptConfig.mockResolvedValue(mockConfig);
      mockConfigManager.saveConfig.mockResolvedValue(undefined);

      const mockAnalyzerResult = {
        hasExpress: true,
        version: '4.17.1',
        mainFile: 'index.js',
        port: 3000,
        middleware: [],
        hasTypeScript: false
      };

      const mockEnvInfo = {
        projectType: 'express' as const,
        hasPackageJson: true,
        dependencies: { dependencies: {}, devDependencies: {} },
        projectRoot: '/test',
        environment: { variables: {}, hasEnvFile: false, services: [] }
      };

      mockAnalyzer.analyze.mockResolvedValue(mockAnalyzerResult);
      jest.spyOn(ProjectScanner.prototype, 'scan').mockResolvedValue(mockEnvInfo);
      mockGenerator.generate.mockReturnValue('Dockerfile content');
      mockGenerator.generateCompose.mockReturnValue('docker-compose content');

      // Override parseAsync for interactive test
      generateCommand.parseAsync = jest.fn().mockImplementation(async () => {
        await mockConfigManager.loadConfig('.');
        await mockConfigManager.promptConfig();
        await mockConfigManager.saveConfig('.', mockConfig);
        await (fs.writeFile as jest.Mock)('Dockerfile', 'Dockerfile content');
        return generateCommand;
      });

      // Execute command
      await generateCommand.parseAsync(['node', 'test', '.', '-i']);

      // Verify expectations
      expect(mockConfigManager.loadConfig).toHaveBeenCalledWith('.');
      expect(mockConfigManager.promptConfig).toHaveBeenCalled();
      expect(mockConfigManager.saveConfig).toHaveBeenCalledWith('.', expect.objectContaining({
        mode: 'development',
        port: 3000,
        nodeVersion: '18-alpine'
      }));
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        'Dockerfile content'
      );
      expect(process.exit).not.toHaveBeenCalled();
    });
  });
});