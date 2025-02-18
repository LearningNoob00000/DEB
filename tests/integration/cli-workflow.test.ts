// tests/integration/cli-workflow.test.ts
import { createExpressCommands } from '../../src/cli/commands/express-commands';
import { ExpressAnalyzer } from '../../src/analyzers/express-analyzer';
import { ExpressDockerGenerator } from '../../src/generators/express-docker-generator';
import { ConfigManager } from '../../src/cli/utils/config-manager';
import { ProjectScanner } from '../../src/analyzers/project-scanner';
import { promises as fs } from 'fs';
import path from 'path';
import { Command } from 'commander';

// Mock implementations
jest.mock('../../src/analyzers/project-scanner');
jest.mock('../../src/analyzers/express-analyzer');
jest.mock('../../src/generators/express-docker-generator');
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    access: jest.fn()
  }
}));

// Create proper mock for createExpressCommands
jest.mock('../../src/cli/commands/express-commands', () => {
  const { Command } = require('commander');
  
  return {
    createExpressCommands: jest.fn().mockImplementation(() => {
      // Create mock commands
      const analyzeCommand = new Command('analyze');
      const generateCommand = new Command('generate');
      
      // Add mock parseAsync methods
      analyzeCommand.parseAsync = jest.fn().mockResolvedValue(analyzeCommand);
      generateCommand.parseAsync = jest.fn().mockImplementation(async () => {
        // This will be called by the tests
        return generateCommand;
      });
      
      return [analyzeCommand, generateCommand];
    })
  };
});

describe('CLI Workflow Integration', () => {
  let mockAnalyzer: jest.Mocked<ExpressAnalyzer>;
  let mockGenerator: jest.Mocked<ExpressDockerGenerator>;
  let mockConfigManager: { loadConfig: jest.Mock; promptConfig: jest.Mock; saveConfig: jest.Mock };
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let originalExit: typeof process.exit;

  beforeEach(() => {
    jest.clearAllMocks();
    originalExit = process.exit;

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

  it('should handle complete CLI workflow with configuration', async () => {
    const mockProjectInfo = {
      hasExpress: true,
      version: '4.17.1',
      mainFile: 'index.js',
      port: 3000,
      middleware: ['body-parser'],
      hasTypeScript: true
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

    mockAnalyzer.analyze.mockResolvedValue(mockProjectInfo);
    mockGenerator.generate.mockReturnValue('mock dockerfile content');
    mockGenerator.generateCompose.mockReturnValue('mock compose content');
    jest.spyOn(ProjectScanner.prototype, 'scan').mockResolvedValue(mockEnvInfo);

    const [_, generateCommand] = createExpressCommands();

    await generateCommand.parseAsync([
      'node', 'test', '.',
      '--dev',
      '--port', '3000',
      '--node-version', '18-alpine'
    ]);

    // Verify process.exit was not called
    expect(process.exit).not.toHaveBeenCalled();

    // Verify configuration was used correctly  
    expect(mockGenerator.generate).toHaveBeenCalledWith(
      mockProjectInfo,
      expect.objectContaining({
        mode: 'development',
        port: 3000,
        nodeVersion: '18-alpine',
        environment: mockEnvInfo.environment
      })
    );

    // Verify files were written
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('Dockerfile'),
      'mock dockerfile content'
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('docker-compose.yml'),
      'mock compose content'
    );
  });

  it('should handle configuration validation errors', async () => {
    const [_, generateCommand] = createExpressCommands();

    await generateCommand.parseAsync([
      'node', 'test', '.',
      '--port', '-1' // Invalid port
    ]);

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid configuration')
    );
  });

  it('should handle environment analysis failures', async () => {
    mockAnalyzer.analyze.mockRejectedValue(new Error('Analysis failed'));

    const [_, generateCommand] = createExpressCommands();

    await generateCommand.parseAsync([
      'node', 'test', '.',
      '--dev'
    ]);

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Generation failed:',
      'Analysis failed'
    );
  });

  it('should handle file system errors', async () => {
    const mockProjectInfo = {
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

    mockAnalyzer.analyze.mockResolvedValue(mockProjectInfo);
    mockGenerator.generate.mockReturnValue('mock dockerfile content');
    mockGenerator.generateCompose.mockReturnValue('mock compose content');
    jest.spyOn(ProjectScanner.prototype, 'scan').mockResolvedValue(mockEnvInfo);
    (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'));

    const [_, generateCommand] = createExpressCommands();

    await generateCommand.parseAsync([
      'node', 'test', '.',
      '--dev'
    ]);

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Generation failed:',
      'Write failed'
    );
  });
});