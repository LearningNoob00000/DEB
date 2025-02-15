// src/generators/docker-config.ts
import { DockerConfig } from '../cli/utils/config-manager';

export class DockerConfigGenerator {
  generateDockerfile(config: DockerConfig): string {
    const stages = [];

    // Base stage
    stages.push(`
FROM node:${config.nodeVersion} AS base
WORKDIR /app
COPY package*.json ./
`);

    // Development stage
    if (config.mode === 'development') {
      stages.push(`
FROM base AS development
RUN npm install
COPY . .
ENV NODE_ENV=development
ENV PORT=${config.port}
CMD ["npm", "run", "dev"]
`);
    }

    // Production build stage
    stages.push(`
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build
`);

    // Production runtime stage
    stages.push(`
FROM node:${config.nodeVersion}-slim AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
ENV NODE_ENV=production
ENV PORT=${config.port}
CMD ["npm", "start"]
`);

    return stages.join('\n');
  }

  generateComposeFile(config: DockerConfig): string {
    const services = {
      app: {
        build: {
          context: '.',
          target: config.mode
        },
        ports: [`${config.port}:${config.port}`],
        environment: [
          `NODE_ENV=${config.mode}`,
          `PORT=${config.port}`
        ],
        volumes: config.volumes,
        networks: config.networks
      }
    };

    return `version: '3.8'\n\nservices:\n${JSON.stringify(services, null, 2)}`;
  }
}
