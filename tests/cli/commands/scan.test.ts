// tests/cli/commands/scan.test.ts
import { createScanCommand } from '../../../src/cli/commands/scan';
import { ProjectScanner } from '../../../src/analyzers/project-scanner';

jest.mock('../../../src/analyzers/project-scanner');

describe('Scan Command', () => {
  let mockScanner: jest.Mocked<ProjectScanner>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockScanner = new ProjectScanner() as jest.Mocked<ProjectScanner>;
    (ProjectScanner as jest.Mock).mockImplementation(() => mockScanner);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process.exit(${code})`);
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should handle Express.js project with mixed required and optional services', async () => {
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
        variables: {},
        services: [
          { name: 'Database', url: 'mongodb://localhost', required: true },
          { name: 'Redis', url: 'redis://localhost', required: false },
          { name: 'RabbitMQ', url: 'amqp://localhost', required: true }
        ]
      }
    };

    mockScanner.scan.mockResolvedValue(mockResult);

    const command = createScanCommand();
    await command.parseAsync(['node', 'test', '.']);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Database'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('RabbitMQ'));
    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Redis'));
  });

  it('should handle scan errors with detailed error messages', async () => {
    const error = new Error('Failed to read project directory');
    mockScanner.scan.mockRejectedValue(error);

    const command = createScanCommand();
    await expect(command.parseAsync(['node', 'test', '.']))
      .rejects
      .toThrow('Process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to read project directory');
  });
});
