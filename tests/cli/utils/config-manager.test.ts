// tests/cli/utils/config-manager.test.ts
import { ConfigManager, DockerConfig } from '../../../src/cli/utils/config-manager';
import { FileSystemUtils } from '../../../src/utils/file-system';

jest.mock('../../../src/utils/file-system');
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockFileSystem: jest.Mocked<FileSystemUtils>;

  beforeEach(() => {
    mockFileSystem = new FileSystemUtils() as jest.Mocked<FileSystemUtils>;
    (FileSystemUtils as jest.Mock).mockImplementation(() => mockFileSystem);
    configManager = new ConfigManager();
  });

  describe('loadConfig', () => {
    it('should load existing configuration', async () => {
      const mockConfig: DockerConfig = {
        mode: 'development',
        port: 3000,
        nodeVersion: '18-alpine',
        volumes: [],
        networks: []
      };

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await configManager.loadConfig('/test/path');
      expect(result).toEqual(mockConfig);
    });

    it('should return null for non-existent config', async () => {
      mockFileSystem.fileExists.mockResolvedValue(false);
      const result = await configManager.loadConfig('/test/path');
      expect(result).toBeNull();
    });
  });
});
