// src/analyzers/express-analyzer.ts
import { promises as fs } from 'fs';
import path from 'path';

export interface ExpressProjectInfo {
  hasExpress: boolean;
  version: string | null;
  mainFile: string | null;
  port: number | null;
  middleware: string[];
  hasTypeScript: boolean;
}

export class ExpressAnalyzer {
  /**
   * Analyzes an Express.js project
   * @param projectPath - Path to project root
   * @returns Analysis results for Express.js specifics
   */
  public async analyze(projectPath: string): Promise<ExpressProjectInfo> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const result: ExpressProjectInfo = {
      hasExpress: false,
      version: null,
      mainFile: null,
      port: null,
      middleware: [],
      hasTypeScript: false
    };

    try {
      // Read and parse package.json
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      // Check for Express
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (dependencies.express) {
        result.hasExpress = true;
        result.version = dependencies.express;
      }

      // Check for TypeScript
      result.hasTypeScript = 'typescript' in dependencies;

      // Find main file
      result.mainFile = packageJson.main || 'index.js';

      // Try to detect port from common config files
      await this.detectPort(projectPath, result);

      // Detect middleware
      await this.detectMiddleware(projectPath, result);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Express analysis failed: ${error.message}`);
      }
      throw error;
    }
  }

  private async detectPort(projectPath: string, result: ExpressProjectInfo): Promise<void> {
    try {
      // Check .env file
      const envPath = path.join(projectPath, '.env');
      const envContent = await fs.readFile(envPath, 'utf-8');
      const portMatch = envContent.match(/PORT\s*=\s*(\d+)/);
      if (portMatch) {
        result.port = parseInt(portMatch[1], 10);
        return;
      }
    } catch {
      // .env file might not exist, continue checking other files
    }

    try {
      // Check main file for common patterns
      const mainPath = path.join(projectPath, result.mainFile || 'index.js');
      const mainContent = await fs.readFile(mainPath, 'utf-8');
      const portMatch = mainContent.match(/\.listen\(\s*(\d+)/);
      if (portMatch) {
        result.port = parseInt(portMatch[1], 10);
      }
    } catch {
      // Main file might not be readable or might not exist
    }
  }

  private async detectMiddleware(projectPath: string, result: ExpressProjectInfo): Promise<void> {
    try {
      const packageContent = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
      const { dependencies = {}, devDependencies = {} } = JSON.parse(packageContent);
      const allDeps = { ...dependencies, ...devDependencies };

      // Common Express middleware
      const commonMiddleware = [
        'body-parser',
        'cors',
        'helmet',
        'morgan',
        'compression',
        'express-session'
      ];

      result.middleware = commonMiddleware.filter(mw => mw in allDeps);
    } catch {
      // Package.json already checked in main analyze method
    }
  }
}
