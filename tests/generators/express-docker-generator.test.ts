// tests/generators/express-docker-generator.test.ts
import { ExpressDockerGenerator } from '../../src/generators/express-docker-generator';
import { ExpressProjectInfo } from '../../src/analyzers/express-analyzer';
import { EnvironmentConfig } from '../../src/analyzers/environment-analyzer';

describe('ExpressDockerGenerator', () => {
  let generator: ExpressDockerGenerator;

  beforeEach(() => {
    generator = new ExpressDockerGenerator();
  });

  describe('generate', () => {
    const baseProjectInfo: ExpressProjectInfo = {
      hasExpress: true,
      version: '4.17.1',
      mainFile: 'index.js',
      port: 3000,
      middleware: [],
      hasTypeScript: false
    };

    it('should generate basic Dockerfile', () => {
      const dockerfile = generator.generate(baseProjectInfo);

      expect(dockerfile).toContain('FROM node:18-alpine');
      expect(dockerfile).toContain('WORKDIR /app');
      expect(dockerfile).toContain('COPY package*.json ./');
      expect(dockerfile).toContain('ENV PORT=3000');
    });

    it('should include TypeScript build step when needed', () => {
      const projectInfo = { ...baseProjectInfo, hasTypeScript: true };
      const dockerfile = generator.generate(projectInfo);

      expect(dockerfile).toContain('RUN npm run build');
    });

    it('should include environment variables from config', () => {
      const envConfig: EnvironmentConfig = {
        variables: {
          NODE_ENV: 'production',
          API_KEY: 'test-key'
        },
        hasEnvFile: true,
        services: []
      };

      const dockerfile = generator.generate(baseProjectInfo, { environment: envConfig });

      expect(dockerfile).toContain('ENV NODE_ENV=production');
      expect(dockerfile).toContain('ENV API_KEY=test-key');
    });

    it('should configure development mode correctly', () => {
      const dockerfile = generator.generate(baseProjectInfo, { isDevelopment: true });

      expect(dockerfile).toContain('RUN npm install --only=development');
      expect(dockerfile).toContain('CMD ["npm", "run", "dev"]');
    });
  });

  describe('generateCompose', () => {
    const baseProjectInfo: ExpressProjectInfo = {
      hasExpress: true,
      version: '4.17.1',
      mainFile: 'index.js',
      port: 3000,
      middleware: [],
      hasTypeScript: false
    };

    it('should generate basic docker-compose.yml', () => {
      const compose = generator.generateCompose(baseProjectInfo);

      expect(compose).toContain('version: \'3.8\'');
      expect(compose).toContain('services:');
      expect(compose).toContain('ports:');
      expect(compose).toContain('"3000:3000"');
    });

    it('should include detected services', () => {
      const envConfig: EnvironmentConfig = {
        variables: {},
        hasEnvFile: true,
        services: [
          { name: 'Database', url: 'mongodb://localhost', required: true },
          { name: 'Redis', url: 'redis://localhost', required: true }
        ]
      };

      const compose = generator.generateCompose(baseProjectInfo, { environment: envConfig });

      expect(compose).toContain('database:');  // Changed from 'mongodb:'
      expect(compose).toContain('redis:');
      expect(compose).toContain('27017:27017');
      expect(compose).toContain('6379:6379');
    });

    it('should configure environment variables', () => {
      const envConfig: EnvironmentConfig = {
        variables: {
          NODE_ENV: 'production',
          API_KEY: 'test-key'
        },
        hasEnvFile: true,
        services: []
      };

      const compose = generator.generateCompose(baseProjectInfo, { environment: envConfig });

      expect(compose).toContain('NODE_ENV=production');
      expect(compose).toContain('API_KEY=test-key');
    });
  });
});
