// src/analyzers/project-scanner.ts
import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemUtils } from '../utils/file-system';
import { EnvironmentAnalyzer, EnvironmentConfig } from './environment-analyzer';

export interface ProjectInfo {
  projectType: 'express' | 'unknown';
  hasPackageJson: boolean;
  dependencies: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  projectRoot: string;
  environment?: EnvironmentConfig;
}

export class ProjectScanner {
  private fileSystem: FileSystemUtils;
  private envAnalyzer: EnvironmentAnalyzer;

  constructor() {
    this.fileSystem = new FileSystemUtils();
    this.envAnalyzer = new EnvironmentAnalyzer();
  }

  public async scan(projectPath: string): Promise<ProjectInfo> {
    const absolutePath = path.resolve(projectPath);
    const hasPackageJson = await this.fileSystem.fileExists(
      path.join(absolutePath, 'package.json')
    );

    let envInfo: EnvironmentConfig = {
      variables: {},
      hasEnvFile: false,
      services: []
    };

    try {
      envInfo = await this.envAnalyzer.analyze(absolutePath);
    } catch (error) {
      // Provide default environment config on error
      console.error('Environment analysis failed:', error);
    }

    if (!hasPackageJson) {
      return {
        projectType: 'unknown',
        hasPackageJson: false,
        dependencies: { dependencies: {}, devDependencies: {} },
        projectRoot: absolutePath,
        environment: envInfo
      };
    }

    const packageJson = await this.readPackageJson(absolutePath);
    const isExpress = 'express' in (packageJson.dependencies || {});

    return {
      projectType: isExpress ? 'express' : 'unknown',
      hasPackageJson: true,
      dependencies: {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
      },
      projectRoot: absolutePath,
      environment: envInfo
    };
  }

  private async readPackageJson(projectPath: string): Promise<any> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const content = await this.fileSystem.readFile(packageJsonPath);
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Failed to parse package.json');
    }
  }
}
