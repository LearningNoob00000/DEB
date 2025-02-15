// tests/integration/config-workflow.test.ts
import { ConfigManager } from '../../src/cli/utils/config-manager';
import { FileSystemUtils } from '../../src/utils/file-system';
import { ConfigValidators } from '../../src/cli/utils/validators';
import path from 'path';
import inquirer from 'inquirer';

// Mock the entire inquirer module
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

describe('Configuration Workflow Integration', () => {
  let configManager: ConfigManager;
  let fileSystem: FileSystemUtils;

  beforeEach(() => {
    configManager = new ConfigManager();
    fileSystem = new FileSystemUtils();
    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should handle complete configuration workflow', async () => {
    const mockConfig = {
      mode: 'development' as const,
      port: 3000,
      nodeVersion: '18-alpine',
      volumes: ['./data:/app/data'],
      networks: []
    };

    // Mock interactive prompts
    (inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>).mockResolvedValue(mockConfig);

    // Test configuration creation
    const config = await configManager.promptConfig();
    expect(config).toEqual(mockConfig);

    // Validate configuration
    const validationErrors = ConfigValidators.validateDockerConfig(config);
    expect(validationErrors).toHaveLength(0);

    // Test configuration persistence
    const tempPath = path.join(__dirname, 'temp');
    await configManager.saveConfig(tempPath, config);

    const loadedConfig = await configManager.loadConfig(tempPath);
    expect(loadedConfig).toEqual(config);
  });

  it('should handle invalid configurations', async () => {
    const invalidConfig = {
      mode: 'invalid' as any,
      port: -1,
      nodeVersion: '18-alpine',
      volumes: ['invalid-volume'],
      networks: []
    };

    const validationErrors = ConfigValidators.validateDockerConfig(invalidConfig);
    expect(validationErrors).toContain('Invalid port number. Must be between 1 and 65535.');
    expect(validationErrors).toContain('Mode must be either "development" or "production"');
    expect(validationErrors).toContain('Invalid volume syntax at index 0: invalid-volume');
  });
});
