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

      // Clear previous mocks
      (fs.readFile as jest.Mock).mockReset();
      
      // Mock readFile to return our config
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configManager.loadConfig('/mock/config/path');

      // Verify readFile was called
      expect(fs.readFile).toHaveBeenCalled();
      
      // Verify the config is what we expect
      expect(config).toMatchObject(mockConfig);
    });

    it('should load configuration from current working directory when path not specified', async () => {
      const mockConfig = {
        outputFormat: 'table',
        batchSize: 5
      };
      
      // Clear previous mocks
      (fs.readFile as jest.Mock).mockReset();
      
      // Mock readFile to return our config
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configManager.loadConfig();

      // Verify readFile was called
      expect(fs.readFile).toHaveBeenCalled();
      
      // Check that config contains our values
      expect(config).toMatchObject(mockConfig);
      
      // Verify the rest of the config is filled with defaults
      expect(config.timeout).toBe(DEFAULT_CONFIG.timeout);
      expect(config.excludePatterns).toEqual(DEFAULT_CONFIG.excludePatterns);
    });

    it('should return default config when file not found', async () => {
      // Mock readFile to fail
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      const config = await configManager.loadConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should return default config when file parsing fails', async () => {
      // Mock readFile to return invalid JSON
      (fs.readFile as jest.Mock).mockResolvedValue('invalid json content');

      const config = await configManager.loadConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should merge partial config with defaults', async () => {
      const partialConfig = {
        outputFormat: 'json'
      };
      
      // Mock readFile
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(partialConfig));

      const config = await configManager.loadConfig();

      // Check specific property was updated
      expect(config.outputFormat).toBe('json');
      
      // Check defaults were preserved
      expect(config.timeout).toBe(DEFAULT_CONFIG.timeout);
      expect(config.batchSize).toBe(DEFAULT_CONFIG.batchSize);
      expect(config.excludePatterns).toEqual(DEFAULT_CONFIG.excludePatterns);
    });
  });
});