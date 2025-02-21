// tests/integration/environment-docker-integration.test.ts
import { EnvironmentAnalyzer } from '../../src/analyzers/environment-analyzer';
import { ExpressDockerGenerator } from '../../src/generators/express-docker-generator';
import { FileSystemUtils } from '../../src/utils/file-system';
import { ExpressProjectInfo } from '../../src/analyzers/express-analyzer';
import path from 'path';

jest.mock('../../src/utils/file-system');

describe('Environment Analyzer and Docker Generator Integration', () => {
  let analyzer: EnvironmentAnalyzer;
  let generator: ExpressDockerGenerator;
  let mockFileSystem: jest.Mocked<FileSystemUtils>;

  const baseProjectInfo: ExpressProjectInfo = {
    hasExpress: true,
    version: '4.17.1',
    mainFile: 'index.js',
    port: 3000,
    middleware: [],
    hasTypeScript: false,
  };

  beforeEach(() => {
    mockFileSystem = new FileSystemUtils() as jest.Mocked<FileSystemUtils>;
    (FileSystemUtils as jest.Mock).mockImplementation(() => mockFileSystem);
    analyzer = new EnvironmentAnalyzer();
    generator = new ExpressDockerGenerator();
  });

  describe('Service Detection and Docker Configuration', () => {
    it('should configure MongoDB service correctly in docker-compose', async () => {
      const mockEnvContent = `
        MONGODB_URI=mongodb://localhost:27017/app
        MONGODB_USER=admin
        MONGODB_PASS=secret
      `;

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockEnvContent);

      const envConfig = await analyzer.analyze('/fake/path');
      const dockerCompose = generator.generateCompose(baseProjectInfo, {
        environment: envConfig,
      });

      // Verify MongoDB service configuration
      expect(dockerCompose).toContain('mongodb:');
      expect(dockerCompose).toContain('image: mongo:latest');
      expect(dockerCompose).toContain('27017:27017');
      expect(dockerCompose).toContain('MONGODB_URI');
      expect(dockerCompose).toContain('depends_on:');
      expect(dockerCompose).toContain('- mongodb');
    });

    it('should configure multiple services with proper dependencies', async () => {
      const mockEnvContent = `
        MONGODB_URI=mongodb://localhost:27017/app
        REDIS_URL=redis://localhost:6379
        RABBITMQ_URL=amqp://localhost:5672
      `;

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockEnvContent);

      const envConfig = await analyzer.analyze('/fake/path');
      const dockerCompose = generator.generateCompose(baseProjectInfo, {
        environment: envConfig,
      });

      // Verify multiple service configurations
      expect(dockerCompose).toContain('mongodb:');
      expect(dockerCompose).toContain('redis:');
      expect(dockerCompose).toContain('rabbitmq:');
      expect(dockerCompose).toContain('depends_on:');
      ['mongodb', 'redis', 'rabbitmq'].forEach((service) => {
        expect(dockerCompose).toContain(`- ${service}`);
      });
    });

    it('should handle optional services in docker configuration', async () => {
      const mockEnvContent = `
        MONGODB_URI=mongodb://localhost:27017/app
        OPTIONAL_REDIS_URL=redis://localhost:6379
      `;

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockEnvContent);

      const envConfig = await analyzer.analyze('/fake/path');
      const dockerCompose = generator.generateCompose(baseProjectInfo, {
        environment: envConfig,
      });

      // Verify optional service handling
      expect(dockerCompose).toContain('mongodb:');
      expect(dockerCompose).toContain('redis:');
      expect(dockerCompose).toContain('OPTIONAL_REDIS_URL');
    });

    it('should configure environment-specific services', async () => {
      const mockEnvContent = `
        DEV_MONGODB_URI=mongodb://localhost:27017/dev
        PROD_MONGODB_URI=mongodb://prod-host:27017/prod
      `;

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockEnvContent);

      const envConfig = await analyzer.analyze('/fake/path');
      const dockerCompose = generator.generateCompose(baseProjectInfo, {
        environment: envConfig,
        isDevelopment: true,
      });

      // Verify environment-specific configuration
      expect(dockerCompose).toContain('DEV_MONGODB_URI');
      expect(dockerCompose).toContain('mongodb://localhost:27017/dev');
      expect(dockerCompose).not.toContain('PROD_MONGODB_URI');
    });

    it('should generate valid Dockerfile with service configurations', async () => {
      const mockEnvContent = `
        MONGODB_URI=mongodb://localhost:27017/app
        REDIS_URL=redis://localhost:6379
        API_KEY=secret
      `;

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockEnvContent);

      const envConfig = await analyzer.analyze('/fake/path');
      const dockerfile = generator.generate(baseProjectInfo, {
        environment: envConfig,
      });

      // Verify Dockerfile environment configuration
      expect(dockerfile).toContain('ENV MONGODB_URI');
      expect(dockerfile).toContain('ENV REDIS_URL');
      expect(dockerfile).toContain('ENV API_KEY');
    });

    it('should handle database connection strings with credentials', async () => {
      const mockEnvContent = `
        MONGODB_URI=mongodb://user:pass@host:27017/db?retryWrites=true
        DATABASE_URL=postgresql://admin:secret@localhost:5432/app
      `;

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockEnvContent);

      const envConfig = await analyzer.analyze('/fake/path');
      const dockerCompose = generator.generateCompose(baseProjectInfo, {
        environment: envConfig,
      });

      // Verify credential handling
      expect(dockerCompose).toContain(
        'MONGODB_URI=mongodb://user:pass@host:27017/db?retryWrites=true'
      );
      expect(dockerCompose).toContain(
        'DATABASE_URL=postgresql://admin:secret@localhost:5432/app'
      );
    });

    it('should configure TypeScript build process with services', async () => {
      const mockEnvContent = `
        MONGODB_URI=mongodb://localhost:27017/app
      `;

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockEnvContent);

      const tsProjectInfo = { ...baseProjectInfo, hasTypeScript: true };
      const envConfig = await analyzer.analyze('/fake/path');

      const dockerfile = generator.generate(tsProjectInfo, {
        environment: envConfig,
        isDevelopment: true,
      });

      // Verify TypeScript configuration with services
      expect(dockerfile).toContain('RUN npm run build');
      expect(dockerfile).toContain('ENV MONGODB_URI');
      expect(dockerfile).toContain('CMD ["npm", "run", "dev"]');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment files gracefully', async () => {
      mockFileSystem.fileExists.mockResolvedValue(false);

      const envConfig = await analyzer.analyze('/fake/path');
      const dockerCompose = generator.generateCompose(baseProjectInfo, {
        environment: envConfig,
      });

      // Verify basic configuration still works
      expect(dockerCompose).toContain("version: '3.8'");
      expect(dockerCompose).toContain('services:');
      expect(dockerCompose).toContain('app:');
    });

    it('should handle malformed service URLs', async () => {
      const mockEnvContent = `
        MONGODB_URI=invalid-url
        REDIS_URL=:invalid:url:
      `;

      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockEnvContent);

      const envConfig = await analyzer.analyze('/fake/path');
      const dockerCompose = generator.generateCompose(baseProjectInfo, {
        environment: envConfig,
      });

      // Verify error handling in URL processing
      expect(dockerCompose).toContain('mongodb:');
      expect(dockerCompose).toContain('redis:');
      expect(dockerCompose).not.toContain(':invalid:url:');
    });
  });
});
