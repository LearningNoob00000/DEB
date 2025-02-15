// tests/analyzers/project-scanner.test.ts
import { ProjectScanner } from '../../src/analyzers/project-scanner';
import { FileSystemUtils } from '../../src/utils/file-system';
import { EnvironmentAnalyzer } from '../../src/analyzers/environment-analyzer';

jest.mock('../../src/utils/file-system');
jest.mock('../../src/analyzers/environment-analyzer');

describe('ProjectScanner', () => {
  let scanner: ProjectScanner;
  let mockFileSystem: jest.Mocked<FileSystemUtils>;
  let mockEnvAnalyzer: jest.Mocked<EnvironmentAnalyzer>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystem = new FileSystemUtils() as jest.Mocked<FileSystemUtils>;
    mockEnvAnalyzer = new EnvironmentAnalyzer() as jest.Mocked<EnvironmentAnalyzer>;

    (FileSystemUtils as jest.Mock).mockImplementation(() => mockFileSystem);
    (EnvironmentAnalyzer as jest.Mock).mockImplementation(() => mockEnvAnalyzer);

    // Mock default environment analysis result
    mockEnvAnalyzer.analyze.mockResolvedValue({
      variables: {},
      hasEnvFile: false,
      services: []
    });

    scanner = new ProjectScanner();
  });

  describe('scan', () => {
    it('should detect Express.js project', async () => {
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1'
        }
      };

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const mockEnvResult = {
        variables: { PORT: '3000' },
        hasEnvFile: true,
        services: [
          { name: 'Database', url: 'mongodb://localhost', required: true }
        ]
      };
      mockEnvAnalyzer.analyze.mockResolvedValue(mockEnvResult);

      const result = await scanner.scan('/fake/path');

      expect(result.projectType).toBe('express');
      expect(result.hasPackageJson).toBe(true);
      expect(result.dependencies.dependencies).toHaveProperty('express');
      expect(result.environment).toEqual(mockEnvResult);
    });

    it('should handle missing package.json with environment check', async () => {
      mockFileSystem.fileExists.mockResolvedValue(false);
      const mockEnvResult = {
        variables: {},
        hasEnvFile: false,
        services: []
      };
      mockEnvAnalyzer.analyze.mockResolvedValue(mockEnvResult);

      const result = await scanner.scan('/fake/path');

      expect(result.projectType).toBe('unknown');
      expect(result.hasPackageJson).toBe(false);
      expect(result.environment).toEqual(mockEnvResult);
    });

    it('should handle environment analysis errors', async () => {
      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue('{}');
      mockEnvAnalyzer.analyze.mockRejectedValue(new Error('Environment analysis failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await scanner.scan('/fake/path');

      expect(result.environment).toEqual({
        variables: {},
        hasEnvFile: false,
        services: []
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Environment analysis failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
