// tests/generators/express-docker-generator.test.ts
import { ExpressDockerGenerator } from '../../src/generators/express-docker-generator';
import { ExpressProjectInfo } from '../../src/analyzers/express-analyzer';
import { EnvironmentConfig } from '../../src/analyzers/environment-analyzer';

describe('ExpressDockerGenerator', () => {
  let generator: ExpressDockerGenerator;

  beforeEach(() => {
    generator = new ExpressDockerGenerator();
  });

  const baseProjectInfo: ExpressProjectInfo = {
    hasExpress: true,
    version: '4.17.1',
    mainFile: 'index.js',
    port: 3000,
    middleware: [],
    hasTypeScript: false,
  };

  describe('generate', () => {
    describe('Base Configuration', () => {
      it('should generate basic Dockerfile with correct structure', () => {
        const dockerfile = generator.generate(baseProjectInfo);

        expect(dockerfile).toContain('FROM node:18-alpine');
        expect(dockerfile).toContain('WORKDIR /app');
        expect(dockerfile).toContain('COPY package*.json ./');
        expect(dockerfile).toContain('RUN npm install');
        expect(dockerfile).toContain('COPY . .');
        expect(dockerfile).toContain('ENV PORT=3000');
      });

      it('should use custom port when provided', () => {
        const dockerfile = generator.generate(baseProjectInfo, { port: 4000 });

        expect(dockerfile).toContain('ENV PORT=4000');
        expect(dockerfile).toContain('EXPOSE 4000');
      });

      it('should use custom Node.js version when specified', () => {
        const dockerfile = generator.generate(baseProjectInfo, {
          nodeVersion: '16-alpine',
        });

        expect(dockerfile).toContain('FROM node:16-alpine');
      });
    });

    describe('TypeScript Support', () => {
      it('should include TypeScript build step when project uses TypeScript', () => {
        const tsProjectInfo = { ...baseProjectInfo, hasTypeScript: true };
        const dockerfile = generator.generate(tsProjectInfo);

        expect(dockerfile).toContain('RUN npm run build');
        expect(dockerfile).toMatch(/COPY.*tsconfig\.json/);
      });

      it('should configure TypeScript development environment correctly', () => {
        const tsProjectInfo = { ...baseProjectInfo, hasTypeScript: true };
        const dockerfile = generator.generate(tsProjectInfo, {
          isDevelopment: true,
        });

        expect(dockerfile).toContain('RUN npm install --only=development');
        expect(dockerfile).toContain('CMD ["npm", "run", "dev"]');
      });
    });

    describe('Environment Configuration', () => {
      it('should handle multiple environment variables', () => {
        const envConfig: EnvironmentConfig = {
          variables: {
            NODE_ENV: 'production',
            API_KEY: 'test-key',
            DEBUG: 'app:*',
          },
          hasEnvFile: true,
          services: [],
        };

        const dockerfile = generator.generate(baseProjectInfo, {
          environment: envConfig,
        });

        expect(dockerfile).toContain('ENV NODE_ENV=production');
        expect(dockerfile).toContain('ENV API_KEY=test-key');
        expect(dockerfile).toContain('ENV DEBUG=app:*');
      });

      it('should handle environment variables with special characters', () => {
        const envConfig: EnvironmentConfig = {
          variables: {
            MONGO_URI: 'mongodb://user:pass@host:27017',
            API_KEY: 'key-with-special=chars&',
          },
          hasEnvFile: true,
          services: [],
        };

        const dockerfile = generator.generate(baseProjectInfo, {
          environment: envConfig,
        });

        expect(dockerfile).toContain(
          'ENV MONGO_URI=mongodb://user:pass@host:27017'
        );
        expect(dockerfile).toContain('ENV API_KEY=key-with-special=chars&');
      });
    });

    describe('Development Mode', () => {
      it('should configure development environment with hot reloading', () => {
        const dockerfile = generator.generate(baseProjectInfo, {
          isDevelopment: true,
        });

        expect(dockerfile).toContain('RUN npm install --only=development');
        expect(dockerfile).toContain('CMD ["npm", "run", "dev"]');
        expect(dockerfile).toContain('ENV NODE_ENV=development');
      });

      it('should include development-specific dependencies', () => {
        const projectInfo = {
          ...baseProjectInfo,
          middleware: ['nodemon', 'ts-node-dev'],
        };

        const dockerfile = generator.generate(projectInfo, {
          isDevelopment: true,
        });

        expect(dockerfile).toContain('RUN npm install');
        expect(dockerfile).toContain('RUN npm install --only=development');
      });
    });

    describe('Production Mode', () => {
      it('should optimize for production environment', () => {
        const dockerfile = generator.generate(baseProjectInfo, {
          isDevelopment: false,
        });

        expect(dockerfile).toContain('RUN npm ci');
        expect(dockerfile).toContain('ENV NODE_ENV=production');
        expect(dockerfile).not.toContain('RUN npm install --only=development');
      });

      it('should include security-related configurations', () => {
        const dockerfile = generator.generate(baseProjectInfo, {
          isDevelopment: false,
        });

        expect(dockerfile).toContain('USER node');
        expect(dockerfile).toContain('ENV NODE_ENV=production');
      });
    });
  });

  describe('generateCompose', () => {
    describe('Basic Configuration', () => {
      it('should generate docker-compose with correct structure', () => {
        const compose = generator.generateCompose(baseProjectInfo);

        expect(compose).toContain("version: '3.8'");
        expect(compose).toContain('services:');
        expect(compose).toMatch(/app:/);
        expect(compose).toMatch(/ports:/);
        expect(compose).toMatch(/"3000:3000"/);
      });

      it('should configure volumes correctly', () => {
        const compose = generator.generateCompose(baseProjectInfo);

        expect(compose).toMatch(/volumes:/);
        expect(compose).toMatch(/\.:/);
        expect(compose).toMatch(/node_modules/);
      });
    });

    describe('Service Integration', () => {
      it('should configure MongoDB service correctly', () => {
        const envConfig: EnvironmentConfig = {
          variables: {},
          hasEnvFile: true,
          services: [
            {
              name: 'MongoDB',
              url: 'mongodb://localhost:27017',
              required: true,
            },
          ],
        };

        const compose = generator.generateCompose(baseProjectInfo, {
          environment: envConfig,
        });

        expect(compose).toMatch(/mongodb:/);
        expect(compose).toMatch(/image: mongo:latest/);
        expect(compose).toMatch(/27017:27017/);
        expect(compose).toMatch(/mongodb_data:/);
      });

      it('should configure Redis service correctly', () => {
        const envConfig: EnvironmentConfig = {
          variables: {},
          hasEnvFile: true,
          services: [
            {
              name: 'Redis',
              url: 'redis://localhost:6379',
              required: true,
            },
          ],
        };

        const compose = generator.generateCompose(baseProjectInfo, {
          environment: envConfig,
        });

        expect(compose).toMatch(/redis:/);
        expect(compose).toMatch(/image: redis:alpine/);
        expect(compose).toMatch(/6379:6379/);
      });

      it('should handle multiple services with dependencies', () => {
        const envConfig: EnvironmentConfig = {
          variables: {},
          hasEnvFile: true,
          services: [
            {
              name: 'MongoDB',
              url: 'mongodb://localhost:27017',
              required: true,
            },
            {
              name: 'Redis',
              url: 'redis://localhost:6379',
              required: true,
            },
          ],
        };

        const compose = generator.generateCompose(baseProjectInfo, {
          environment: envConfig,
        });

        expect(compose).toMatch(/depends_on:/);
        expect(compose).toMatch(/- mongodb/);
        expect(compose).toMatch(/- redis/);
      });
    });

    describe('Development Environment', () => {
      it('should configure development-specific settings', () => {
        const compose = generator.generateCompose(baseProjectInfo, {
          isDevelopment: true,
        });

        expect(compose).toMatch(/command: npm run dev/);
        expect(compose).toMatch(/NODE_ENV=development/);
        expect(compose).toMatch(/volumes:/);
      });

      it('should include debugging configuration', () => {
        const compose = generator.generateCompose(baseProjectInfo, {
          isDevelopment: true,
          port: 3000,
        });

        expect(compose).toMatch(/9229:9229/); // Debug port
        expect(compose).toMatch(/command: npm run dev/);
      });
    });
  });
});
