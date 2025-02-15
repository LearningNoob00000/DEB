// tests/analyzers/environment-analyzer.test.ts
import { EnvironmentAnalyzer } from '../../src/analyzers/environment-analyzer';
import { FileSystemUtils } from '../../src/utils/file-system';

jest.mock('../../src/utils/file-system');

describe('EnvironmentAnalyzer', () => {
  let analyzer: EnvironmentAnalyzer;
  let mockFileSystem: jest.Mocked<FileSystemUtils>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystem = new FileSystemUtils() as jest.Mocked<FileSystemUtils>;
    (FileSystemUtils as jest.Mock).mockImplementation(() => mockFileSystem);
    analyzer = new EnvironmentAnalyzer();
  });

  it('should detect environment file and parse variables', async () => {
    const mockEnvContent = `
      DB_HOST=localhost
      DB_PORT=5432
      API_KEY=secret
      # Comment line
      EMPTY_VAR=
    `;

    mockFileSystem.fileExists.mockResolvedValueOnce(true); // .env exists
    mockFileSystem.fileExists.mockResolvedValueOnce(false); // .env.example doesn't exist
    mockFileSystem.readFile.mockResolvedValueOnce(mockEnvContent);

    const result = await analyzer.analyze('/fake/path');

    expect(result.hasEnvFile).toBe(true);
    expect(result.variables).toEqual({
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      API_KEY: 'secret',
      EMPTY_VAR: ''
    });
  });

  it('should detect services from environment variables', async () => {
    const mockEnvExample = `
      DATABASE_URL=postgresql://localhost:5432/db
      REDIS_URL=redis://localhost:6379
      OPTIONAL_ELASTIC_URL=http://localhost:9200
    `;

    mockFileSystem.fileExists.mockResolvedValueOnce(false); // .env doesn't exist
    mockFileSystem.fileExists.mockResolvedValueOnce(true); // .env.example exists
    mockFileSystem.readFile.mockResolvedValueOnce(mockEnvExample);

    const result = await analyzer.analyze('/fake/path');

    expect(result.services).toContainEqual({
      name: 'Database',
      url: 'postgresql://localhost:5432/db',
      required: true
    });
    expect(result.services).toContainEqual({
      name: 'Redis',
      url: 'redis://localhost:6379',
      required: true
    });
    expect(result.services).toContainEqual({
      name: 'Elasticsearch',
      url: 'http://localhost:9200',
      required: false
    });
  });

  it('should handle missing environment files', async () => {
    mockFileSystem.fileExists.mockResolvedValue(false);

    const result = await analyzer.analyze('/fake/path');

    expect(result.hasEnvFile).toBe(false);
    expect(result.variables).toEqual({});
    expect(result.services).toEqual([]);
  });
});
