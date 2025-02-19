// src/analyzers/express-analyzer.ts
import path from 'path';
import { FileSystemUtils } from '../utils/file-system';

export interface ExpressProjectInfo {
  hasExpress: boolean;
  version: string | null;
  mainFile: string | null;
  port: number | null;
  middleware: string[];
  hasTypeScript: boolean;
}

export class ExpressAnalyzer {
  private fileSystem: FileSystemUtils;

  constructor() {
    this.fileSystem = new FileSystemUtils();
  }

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
      // Check if package.json exists
      const packageJsonExists = await this.fileSystem.fileExists(packageJsonPath);
      if (!packageJsonExists) {
        return result;
      }

      // Read and parse package.json
      const packageContent = await this.fileSystem.readFile(packageJsonPath);
      const packageJson = JSON.parse(packageContent);

      // Check for Express
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (dependencies && dependencies.express) {
        result.hasExpress = true;
        result.version = dependencies.express;
      }

      // Check for TypeScript
      result.hasTypeScript = dependencies && 'typescript' in dependencies;

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
      const envExists = await this.fileSystem.fileExists(envPath);
      
      if (envExists) {
        const envContent = await this.fileSystem.readFile(envPath);
        const portMatch = envContent.match(/PORT\s*=\s*(\d+)/);
        if (portMatch) {
          result.port = parseInt(portMatch[1], 10);
          return;
        }
      }
    } catch {
      // .env file might not exist, continue checking other files
    }

    try {
      // Check main file for common patterns
      if (result.mainFile) {
        const mainPath = path.join(projectPath, result.mainFile);
        const mainExists = await this.fileSystem.fileExists(mainPath);
        
        if (mainExists) {
          const mainContent = await this.fileSystem.readFile(mainPath);
          const portMatch = mainContent.match(/\.listen\(\s*(\d+)/);
          if (portMatch) {
            result.port = parseInt(portMatch[1], 10);
          }
        }
      }
    } catch {
      // Main file might not be readable or might not exist
    }
  }

  private async detectMiddleware(projectPath: string, result: ExpressProjectInfo): Promise<void> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageContent = await this.fileSystem.readFile(packageJsonPath);
      const packageJson = JSON.parse(packageContent);
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
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