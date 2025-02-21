// tests/generators/docker-config.test.ts
import { DockerConfigGenerator } from '../../src/generators/docker-config';
import { DockerConfig } from '../../src/cli/utils/config-manager';

describe('DockerConfigGenerator', () => {
  let generator: DockerConfigGenerator;

  beforeEach(() => {
    generator = new DockerConfigGenerator();
  });

  describe('generateDockerfile', () => {
    it('should generate development Dockerfile correctly', () => {
      const config: DockerConfig = {
        mode: 'development',
        port: 3000,
        nodeVersion: '18-alpine',
        volumes: ['./src:/app/src'],
        networks: [],
      };

      const dockerfile = generator.generateDockerfile(config);

      // Verify development-specific content
      expect(dockerfile).toContain('FROM node:18-alpine AS base');
      expect(dockerfile).toContain('FROM base AS development');
      expect(dockerfile).toContain('RUN npm install');
      expect(dockerfile).toContain('ENV NODE_ENV=development');
      expect(dockerfile).toContain('ENV PORT=3000');
      expect(dockerfile).toContain('CMD ["npm", "run", "dev"]');
    });

    it('should generate production Dockerfile correctly', () => {
      const config: DockerConfig = {
        mode: 'production',
        port: 8080,
        nodeVersion: '16-alpine',
        volumes: [],
        networks: [],
      };

      const dockerfile = generator.generateDockerfile(config);

      // Verify production-specific content
      expect(dockerfile).toContain('FROM node:16-alpine AS base');
      expect(dockerfile).toContain('FROM base AS builder');
      expect(dockerfile).toContain('RUN npm ci');
      expect(dockerfile).toContain('RUN npm run build');
      expect(dockerfile).toContain('FROM node:16-alpine-slim AS production');
      expect(dockerfile).toContain('ENV NODE_ENV=production');
      expect(dockerfile).toContain('ENV PORT=8080');
    });
  });

  describe('generateComposeFile', () => {
    it('should generate development compose file correctly', () => {
      const config: DockerConfig = {
        mode: 'development',
        port: 3000,
        nodeVersion: '18-alpine',
        volumes: ['./src:/app/src', './package.json:/app/package.json'],
        networks: ['app-network'],
      };

      const compose = generator.generateComposeFile(config);

      // Parse the compose file to verify contents
      expect(compose).toContain("version: '3.8'");
      expect(compose).toContain('services:');

      // Verify that the JSON structure contains the expected values
      expect(compose).toContain('"target": "development"');
      expect(compose).toContain('"3000:3000"');
      expect(compose).toContain('"NODE_ENV=development"');
      expect(compose).toContain('"PORT=3000"');
      expect(compose).toContain('"./src:/app/src"');
      expect(compose).toContain('"./package.json:/app/package.json"');
      expect(compose).toContain('"app-network"');
    });

    it('should generate production compose file correctly', () => {
      const config: DockerConfig = {
        mode: 'production',
        port: 80,
        nodeVersion: '18-alpine',
        volumes: ['data:/app/data'],
        networks: ['prod-network'],
      };

      const compose = generator.generateComposeFile(config);

      // Verify production-specific content
      expect(compose).toContain('"target": "production"');
      expect(compose).toContain('"80:80"');
      expect(compose).toContain('"NODE_ENV=production"');
      expect(compose).toContain('"data:/app/data"');
      expect(compose).toContain('"prod-network"');
    });
  });
});
