// tests/cli/config.test.ts
import { ConfigManager, CliConfig } from '../../src/cli/config';
import { promises as fs } from 'fs';
import path from 'path';

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));

// Mock path.join to return predictable paths
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((dir, file) => `${dir}/${file}`)
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const DEFAULT_CONFIG: CliConfig = {
    outputFormat: 'simple',
    timeout: 30000,
    batchSize: 10,
    excludePatterns: ['node_modules', '.git']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = new ConfigManager();
    process.cwd = jest.fn().mockReturnValue('/mock/cwd');
  });

  describe('loadConfig', () => {
    it('should load configuration from specified path', async () => {
      const mockConfig = {
        outputFormat: 'json',
        timeout: 60000,
        batchSize: 20,
        excludePatterns: ['node_modules', '.git', 'dist']
      };

      // Set up the mock return values
      const mockFilePath = '/mock/config/path/.devenvrc.json';
      (path.join as jest.Mock).mockReturnValueOnce(mockFilePath);
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockConfig));

      const config = await configManager.loadConfig('/mock/config/path');

      expect(path.join).toHaveBeenCalledWith('/mock/config/path', '.devenvrc.json');
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, 'utf-8');
      expect(config).toEqual(mockConfig);
    });

    it('should load configuration from current working directory when path not specified', async () => {
      const mockConfig = {
        outputFormat: 'table',
        batchSize: 5
      };

      (path.join as jest.Mock).mockReturnValueOnce('/mock/cwd/.devenvrc.json');
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockConfig));

      const config = await configManager.loadConfig();

      expect(path.join).toHaveBeenCalledWith('/mock/cwd', '.devenvrc.json');
      expect(fs.readFile).toHaveBeenCalledWith('/mock/cwd/.devenvrc.json', 'utf-8');
      expect(config).toEqual({
        ...DEFAULT_CONFIG,
        ...mockConfig
      });
    });

    it('should return default config when file not found', async () => {
      (path.join as jest.Mock).mockReturnValueOnce('/mock/cwd/.devenvrc.json');
      (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      const config = await configManager.loadConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should return default config when file parsing fails', async () => {
      (path.join as jest.Mock).mockReturnValueOnce('/mock/cwd/.devenvrc.json');
      (fs.readFile as jest.Mock).mockResolvedValueOnce('invalid json content');

      const config = await configManager.loadConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should merge partial config with defaults', async () => {
      const partialConfig = {
        outputFormat: 'json'
      };

      (path.join as jest.Mock).mockReturnValueOnce('/mock/cwd/.devenvrc.json');
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(partialConfig));

      const config = await configManager.loadConfig();

      expect(config).toEqual({
        ...DEFAULT_CONFIG,
        ...partialConfig
      });
    });
  });
});