// tests/cli/commands/analyze.test.ts
import { createAnalyzeCommand } from '../../../src/cli/commands/analyze';
import { ProjectScanner } from '../../../src/analyzers/project-scanner';
import { ProgressIndicator } from '../../../src/cli/utils/progress';

jest.mock('../../../src/analyzers/project-scanner');
jest.mock('../../../src/cli/utils/progress');

describe('Analyze Command', () => {
  let mockScanner: jest.Mocked<ProjectScanner>;
  let mockProgress: jest.Mocked<ProgressIndicator>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockScanner = new ProjectScanner() as jest.Mocked<ProjectScanner>;
    mockProgress = new ProgressIndicator() as jest.Mocked<ProgressIndicator>;

    (ProjectScanner as jest.Mock).mockImplementation(() => mockScanner);
    (ProgressIndicator as jest.Mock).mockImplementation(() => mockProgress);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should display detailed environment information in human-readable format', async () => {
    const mockResult = {
      projectType: 'express' as const,
      hasPackageJson: true,
      dependencies: {
        dependencies: { 'express': '^4.17.1' },
        devDependencies: {}
      },
      projectRoot: '/test',
      environment: {
        hasEnvFile: true,
        variables: {
          PORT: '3000',
          NODE_ENV: 'development'
        },
        services: [
          { name: 'Database', url: 'mongodb://localhost', required: true },
          { name: 'Redis', url: 'redis://localhost', required: false }
        ]
      }
    };

    mockScanner.scan.mockResolvedValue(mockResult);

    const command = createAnalyzeCommand();
    await command.parseAsync(['node', 'test', '.']);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Environment Configuration'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Found'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Database (Required)'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Redis (Optional)'));
  });

  it('should handle missing environment configuration', async () => {
    const mockResult = {
      projectType: 'express' as const,
      hasPackageJson: true,
      dependencies: {
        dependencies: {},
        devDependencies: {}
      },
      projectRoot: '/test',
      environment: {
        hasEnvFile: false,
        variables: {},
        services: []
      }
    };

    mockScanner.scan.mockResolvedValue(mockResult);

    const command = createAnalyzeCommand();
    await command.parseAsync(['node', 'test', '.']);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Not found'));
  });
});
