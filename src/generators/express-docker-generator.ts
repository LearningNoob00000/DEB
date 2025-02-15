// src/generators/express-docker-generator.ts
import { ExpressProjectInfo } from '../analyzers/express-analyzer';
import { EnvironmentConfig } from '../analyzers/environment-analyzer';

export interface DockerConfig {
  nodeVersion: string;
  port: number;
  hasTypeScript: boolean;
  isDevelopment: boolean;
  environment?: EnvironmentConfig;
}

export class ExpressDockerGenerator {
  public generate(projectInfo: ExpressProjectInfo, config: Partial<DockerConfig> = {}): string {
    const finalConfig: DockerConfig = {
      nodeVersion: config.nodeVersion || '18-alpine',
      port: config.port || projectInfo.port || 3000,
      hasTypeScript: config.hasTypeScript ?? projectInfo.hasTypeScript,
      isDevelopment: config.isDevelopment || false,
      environment: config.environment
    };

    const dockerCommands = [
      `FROM node:${finalConfig.nodeVersion}`,
      'WORKDIR /app',
      '',
      '# Install dependencies',
      'COPY package*.json ./',
      'RUN npm install',
      '',
      '# Copy source code',
      'COPY . .',
      ''
    ];

    // Add TypeScript build step if needed
    if (finalConfig.hasTypeScript) {
      dockerCommands.push(
        '# Build TypeScript',
        'RUN npm run build',
        ''
      );
    }

    // Add environment variables
    if (finalConfig.environment?.variables) {
      dockerCommands.push('# Environment variables');
      Object.entries(finalConfig.environment.variables).forEach(([key, value]) => {
        dockerCommands.push(`ENV ${key}=${value}`);
      });
      dockerCommands.push('');
    }

    // Add development-specific commands
    if (finalConfig.isDevelopment) {
      dockerCommands.push(
        '# Development setup',
        'RUN npm install --only=development',
        `ENV PORT=${finalConfig.port}`,
        `EXPOSE ${finalConfig.port}`,
        'CMD ["npm", "run", "dev"]'
      );
    } else {
      // Production setup
      dockerCommands.push(
        '# Production setup',
        `ENV PORT=${finalConfig.port}`,
        `EXPOSE ${finalConfig.port}`,
        'CMD ["npm", "start"]'
      );
    }

    return dockerCommands.join('\n');
  }

  public generateCompose(projectInfo: ExpressProjectInfo, config: Partial<DockerConfig> = {}): string {
    const port = config.port || projectInfo.port || 3000;
    const services: string[] = ['app:'];

    // Base app service configuration
    services.push([
      '    build: .',
      `    ports:`,
      `      - "${port}:${port}"`,
      '    environment:',
      `      - PORT=${port}`
    ].join('\n'));

    // Add environment variables
    if (config.environment?.variables) {
      Object.entries(config.environment.variables).forEach(([key, value]) => {
        services.push(`      - ${key}=${value}`);
      });
    }

    // Add volumes
    services.push([
      '    volumes:',
      '      - .:/app',
      '      - /app/node_modules'
    ].join('\n'));

    // Add detected services
    if (config.environment?.services) {
      config.environment.services.forEach(service => {
        const serviceName = service.name.toLowerCase();
        services.push(`\n  ${serviceName}:`);

        switch (serviceName) {
          case 'database':
          case 'mongodb':
            services.push([
              '    image: mongo:latest',
              '    ports:',
              '      - "27017:27017"'
            ].join('\n'));
            break;
          case 'redis':
            services.push([
              '    image: redis:alpine',
              '    ports:',
              '      - "6379:6379"'
            ].join('\n'));
            break;
          // Add more service templates as needed
        }
      });
    }

    return `
version: '3.8'

services:
  ${services.join('\n')}
`.trim();
  }
}
