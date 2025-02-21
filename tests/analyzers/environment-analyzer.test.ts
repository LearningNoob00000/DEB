// tests/analyzers/environment-analyzer.test.ts
import { EnvironmentAnalyzer } from '../../src/analyzers/environment-analyzer';
import { FileSystemUtils } from '../../src/utils/file-system';
import path from 'path';

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

  describe('analyze', () => {
    describe('Environment File Detection', () => {
      it('should detect and parse .env file', async () => {
        const mockEnvContent = `
          DB_HOST=localhost
          DB_PORT=5432
          API_KEY=secret
        `;

        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockResolvedValueOnce(mockEnvContent);

        const result = await analyzer.analyze('/fake/path');

        expect(result.hasEnvFile).toBe(true);
        expect(result.variables).toEqual({
          DB_HOST: 'localhost',
          DB_PORT: '5432',
          API_KEY: 'secret',
        });
      });

      it('should handle missing .env file gracefully', async () => {
        mockFileSystem.fileExists.mockResolvedValue(false);

        const result = await analyzer.analyze('/fake/path');

        expect(result.hasEnvFile).toBe(false);
        expect(result.variables).toEqual({});
        expect(result.services).toEqual([]);
      });

      it('should handle empty .env file', async () => {
        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockResolvedValueOnce('');

        const result = await analyzer.analyze('/fake/path');

        expect(result.hasEnvFile).toBe(true);
        expect(result.variables).toEqual({});
      });

      it('should handle .env file with comments and empty lines', async () => {
        const mockEnvContent = `
          # Database configuration
          DB_HOST=localhost
          
          # API configuration
          API_KEY=secret
          
          # Empty value
          EMPTY_VAR=
        `;

        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockResolvedValueOnce(mockEnvContent);

        const result = await analyzer.analyze('/fake/path');

        expect(result.variables).toEqual({
          DB_HOST: 'localhost',
          API_KEY: 'secret',
          EMPTY_VAR: '',
        });
      });
    });

    describe('Service Detection', () => {
      it('should detect database services', async () => {
        const mockEnvContent = `
          MONGODB_URI=mongodb://localhost:27017/db
          POSTGRES_URL=postgresql://user:pass@localhost:5432/db
          MYSQL_HOST=localhost
          MYSQL_PORT=3306
        `;

        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockResolvedValueOnce(mockEnvContent);

        const result = await analyzer.analyze('/fake/path');

        expect(result.services).toContainEqual({
          name: 'MongoDB',
          url: 'mongodb://localhost:27017/db',
          required: true,
        });
        expect(result.services).toContainEqual({
          name: 'Database',
          url: 'postgresql://user:pass@localhost:5432/db',
          required: true,
        });
      });

      it('should detect cache and message queue services', async () => {
        const mockEnvContent = `
          REDIS_URL=redis://localhost:6379
          RABBITMQ_URL=amqp://localhost:5672
          KAFKA_BROKERS=localhost:9092
        `;

        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockResolvedValueOnce(mockEnvContent);

        const result = await analyzer.analyze('/fake/path');

        expect(result.services).toContainEqual({
          name: 'Redis',
          url: 'redis://localhost:6379',
          required: true,
        });
        expect(result.services).toContainEqual({
          name: 'RabbitMQ',
          url: 'amqp://localhost:5672',
          required: true,
        });
        expect(result.services).toContainEqual({
          name: 'Kafka',
          url: 'localhost:9092',
          required: true,
        });
      });

      it('should detect optional services', async () => {
        const mockEnvContent = `
          OPTIONAL_REDIS_URL=redis://localhost:6379
          OPTIONAL_ELASTICSEARCH_URL=http://localhost:9200
        `;

        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockResolvedValueOnce(mockEnvContent);

        const result = await analyzer.analyze('/fake/path');

        expect(result.services).toContainEqual({
          name: 'Redis',
          url: 'redis://localhost:6379',
          required: false,
        });
        expect(result.services).toContainEqual({
          name: 'Elasticsearch',
          url: 'http://localhost:9200',
          required: false,
        });
      });

      it('should handle multiple service instances', async () => {
        const mockEnvContent = `
          MONGODB_PRIMARY_URI=mongodb://primary:27017
          MONGODB_SECONDARY_URI=mongodb://secondary:27017
          REDIS_CACHE_URL=redis://cache:6379
          REDIS_QUEUE_URL=redis://queue:6379
        `;

        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockResolvedValueOnce(mockEnvContent);

        const result = await analyzer.analyze('/fake/path');

        expect(
          result.services.filter((s) => s.name === 'MongoDB')
        ).toHaveLength(2);
        expect(result.services.filter((s) => s.name === 'Redis')).toHaveLength(
          2
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle file read errors', async () => {
        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockRejectedValueOnce(new Error('Read error'));

        const result = await analyzer.analyze('/fake/path');

        expect(result.hasEnvFile).toBe(false);
        expect(result.variables).toEqual({});
        expect(result.services).toEqual([]);
      });

      it('should handle malformed environment variables', async () => {
        const mockEnvContent = `
          VALID_VAR=value
          INVALID_VAR
          =invalid_value
          ANOTHER_VALID_VAR=value2
        `;

        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockResolvedValueOnce(mockEnvContent);

        const result = await analyzer.analyze('/fake/path');

        expect(result.variables).toEqual({
          VALID_VAR: 'value',
          ANOTHER_VALID_VAR: 'value2',
        });
      });

      it('should handle permission errors', async () => {
        const error = new Error('Permission denied');
        (error as NodeJS.ErrnoException).code = 'EACCES';

        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockRejectedValueOnce(error);

        await expect(analyzer.analyze('/fake/path')).rejects.toThrow(
          'Permission denied'
        );
      });
    });

    describe('Complex Configurations', () => {
      it('should handle complex URLs and credentials', async () => {
        const mockEnvContent = `
          DATABASE_URL=postgresql://user:complex!pass@word@host:5432/db?ssl=true
          REDIS_URL=redis://:password123@host:6379/0
          MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true
        `;

        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockResolvedValueOnce(mockEnvContent);

        const result = await analyzer.analyze('/fake/path');

        expect(result.services).toContainEqual(
          expect.objectContaining({
            name: 'Database',
            url: expect.stringContaining('postgresql://'),
          })
        );
        expect(result.services).toContainEqual(
          expect.objectContaining({
            name: 'Redis',
            url: expect.stringContaining('redis://'),
          })
        );
        expect(result.services).toContainEqual(
          expect.objectContaining({
            name: 'MongoDB',
            url: expect.stringContaining('mongodb+srv://'),
          })
        );
      });

      it('should handle environment-specific configurations', async () => {
        const mockEnvContent = `
          DEV_DATABASE_URL=postgresql://localhost/dev
          PROD_DATABASE_URL=postgresql://prod-host/prod
          TEST_DATABASE_URL=postgresql://localhost/test
        `;

        mockFileSystem.fileExists.mockResolvedValueOnce(true);
        mockFileSystem.readFile.mockResolvedValueOnce(mockEnvContent);

        const result = await analyzer.analyze('/fake/path');

        expect(result.services).toHaveLength(3);
        expect(result.services.every((s) => s.name === 'Database')).toBe(true);
      });
    });
  });
});
