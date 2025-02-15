// tests/cli/commands/express-commands.test.ts
import { createExpressCommands } from '../../../src/cli/commands/express-commands';
import { ExpressAnalyzer } from '../../../src/analyzers/express-analyzer';
import { ExpressDockerGenerator } from '../../../src/generators/express-docker-generator';
import { promises as fs } from 'fs';
import { ProjectScanner } from '../../../src/analyzers/project-scanner';
import { ConfigManager } from '../../../src/cli/utils/config-manager';

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

      const [analyzeCommand] = createExpressCommands();
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

      const [analyzeCommand] = createExpressCommands();
      await analyzeCommand.parseAsync(['node', 'test', '.', '--json']);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(mockResult, null, 2));
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

      const [_, generateCommand] = createExpressCommands();
      await generateCommand.parseAsync(['node', 'test', '.']);

      expect(process.exit).not.toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('Dockerfile'),
        'Dockerfile content'
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        'docker-compose content'
      );
    });

    it('should handle generation errors', async () => {
      const mockError = new Error('Generation failed');
      mockAnalyzer.analyze.mockRejectedValue(mockError);

      const [_, generateCommand] = createExpressCommands();
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

      const [_, generateCommand] = createExpressCommands();
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
      mockConfigManager.saveConfig.mockResolvedValue(undefined);  // Fixed: provide undefined as value

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

      // Execute command
      const [_, generateCommand] = createExpressCommands();
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
        expect.stringContaining('Dockerfile'),
        'Dockerfile content'
      );
      expect(process.exit).not.toHaveBeenCalled();
    });
  });
});
