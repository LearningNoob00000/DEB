// src/cli/commands/express-commands.ts
import { Command } from 'commander';
import { ExpressAnalyzer } from '../../analyzers/express-analyzer';
import { ExpressDockerGenerator } from '../../generators/express-docker-generator';
import { promises as fs } from 'fs';
import path from 'path';
import { ProjectScanner } from '../../analyzers/project-scanner';
import { ConfigManager, DockerConfig } from '../utils/config-manager';
import { ConfigValidators } from '../utils/validators';
import { FileSystemUtils } from '../../utils/file-system';

export function createExpressCommands(): Command[] {
  const analyzer = new ExpressAnalyzer();
  const generator = new ExpressDockerGenerator();
  const configManager = new ConfigManager();
  const fileSystem = new FileSystemUtils();

  // Create express parent command
  const expressCommand = new Command('express')
    .description('Express.js project commands');

  // Add analyze as a subcommand of express
  expressCommand.command('analyze')
    .description('Analyze Express.js project')
    .argument('[dir]', 'Project directory', '.')
    .option('--json', 'Output as JSON')
    .action(async (dir, options) => {
      try {
        // Verify package.json exists
        const packageJsonPath = path.join(dir, 'package.json');
        if (!(await fileSystem.fileExists(packageJsonPath))) {
          console.error('package.json not found');
          process.exit(1);
          return;
        }

        const result = await analyzer.analyze(dir);

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log('\nExpress.js Project Analysis:');
          console.log('---------------------------');
          console.log(`Express Version: ${result.version || 'Not detected'}`);
          console.log(`Main File: ${result.mainFile}`);
          console.log(`Port: ${result.port || 'Not detected'}`);
          console.log(`TypeScript: ${result.hasTypeScript ? 'Yes' : 'No'}`);
          console.log('Middleware:', result.middleware.length ? result.middleware.join(', ') : 'None detected');
        }
      } catch (error) {
        console.error('Analysis failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Add generate as a subcommand of express
  expressCommand.command('generate')
    .description('Generate Docker configuration')
    .argument('[dir]', 'Project directory', '.')
    .option('-d, --dev', 'Generate development configuration')
    .option('-p, --port <number>', 'Override port number')
    .option('--node-version <version>', 'Specify Node.js version')
    .option('-i, --interactive', 'Use interactive configuration')
    .action(async (dir, options) => {
  try {
    // Parse and validate configuration first
    let config: DockerConfig;
    try {
      if (options.interactive) {
        const existingConfig = await configManager.loadConfig(dir);
        config = await configManager.promptConfig(existingConfig || undefined);
      } else {
        if (options.port) {
          const port = parseInt(options.port, 10);
          if (isNaN(port) || port < 1 || port > 65535) {
            console.error('Invalid configuration:');
            console.error('- Invalid port number');
            process.exit(1);
            return;
          }
        }
        config = {
          mode: options.dev ? 'development' : 'production',
          port: options.port ? parseInt(options.port, 10) : 3000,
          nodeVersion: options.nodeVersion || '18-alpine',
          volumes: [],
          networks: []
        };
      }
    } catch (error) {
      console.error('Configuration error:', error instanceof Error ? error.message : error);
      process.exit(1);
      return;
    }

        // Validate configuration
            // Validate full configuration
    const validationErrors = ConfigValidators.validateDockerConfig(config);
    if (validationErrors.length > 0) {
      console.error('Invalid configuration:');
      validationErrors.forEach(error => console.error(`- ${error}`));
      process.exit(1);
      return;
    }

    // Verify package.json exists
    const packageJsonPath = path.join(dir, 'package.json');
    if (!(await fileSystem.fileExists(packageJsonPath))) {
      console.error('package.json not found');
      process.exit(1);
      return;
    }


        // Analyze project
        const projectInfo = await analyzer.analyze(dir);
        const envInfo = await new ProjectScanner().scan(dir);

        // Generate configurations
        const dockerfile = generator.generate(projectInfo, {
          ...config,
          environment: envInfo.environment,
          hasTypeScript: projectInfo.hasTypeScript,
          isDevelopment: config.mode === 'development'
        });

        const dockerCompose = generator.generateCompose(projectInfo, {
          ...config,
          environment: envInfo.environment,
          hasTypeScript: projectInfo.hasTypeScript,
          isDevelopment: config.mode === 'development'
        });

        // Save configuration for future use
        if (options.interactive) {
          await configManager.saveConfig(dir, config);
        }

        // Write files
        const dockerfilePath = path.join(dir, 'Dockerfile');
        const dockerComposePath = path.join(dir, 'docker-compose.yml');
        
        await Promise.all([
          fs.writeFile(dockerfilePath, dockerfile),
          fs.writeFile(dockerComposePath, dockerCompose)
        ]);

        console.log('✅ Generated Docker configuration files:');
        console.log('- Dockerfile');
        console.log('- docker-compose.yml');
        if (options.interactive) {
          console.log('- .devenvrc.json (configuration file)');
        }

        if (envInfo.environment?.services.length) {
          console.log('\nDetected services:');
          envInfo.environment.services.forEach(service => {
            console.log(`- ${service.name} (${service.required ? 'Required' : 'Optional'})`);
          });
        }
      } catch (error) {
        console.error('Generation failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return [expressCommand];
}