// src/cli/commands/express-commands.ts
import { Command } from 'commander';
import { ExpressAnalyzer } from '../../analyzers/express-analyzer';
import { ExpressDockerGenerator } from '../../generators/express-docker-generator';
import { promises as fs } from 'fs';
import path from 'path';
import { ProjectScanner } from '../../analyzers/project-scanner';
import { ConfigManager, DockerConfig } from '../utils/config-manager';
import { ConfigValidators } from '../utils/validators';
import { ErrorMessages } from '../utils/error-messages';

export function createExpressCommands(): Command[] {
  const analyzer = new ExpressAnalyzer();
  const generator = new ExpressDockerGenerator();
  const configManager = new ConfigManager();

  const analyzeCommand = new Command('analyze')
    .description('Analyze Express.js project')
    .argument('[dir]', 'Project directory', '.')
    .option('--json', 'Output as JSON')
    .action(async (dir, options) => {
      try {
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

  const generateCommand = new Command('generate')
    .description('Generate Docker configuration')
    .argument('[dir]', 'Project directory', '.')
    .option('-d, --dev', 'Generate development configuration')
    .option('-p, --port <number>', 'Override port number')
    .option('--node-version <version>', 'Specify Node.js version')
    .option('-i, --interactive', 'Use interactive configuration')
    .action(async (dir, options) => {
      try {
        // Load or create configuration
        let config: DockerConfig = options.interactive
          ? await configManager.loadConfig(dir).then(existing =>
            configManager.promptConfig(existing || undefined)
          )
          : {
            mode: options.dev ? 'development' : 'production',
            port: options.port ? parseInt(options.port, 10) : 3000,
            nodeVersion: options.nodeVersion || '18-alpine',
            volumes: [],
            networks: []
          } as DockerConfig;

        // Validate configuration
        const validationErrors = ConfigValidators.validateDockerConfig(config);
        if (validationErrors.length > 0) {
          console.error('Invalid configuration:');
          validationErrors.forEach(error => console.error(`- ${error}`));
          process.exit(1);
        }

        // Analyze project
        const projectInfo = await analyzer.analyze(dir);
        const envInfo = await new ProjectScanner().scan(dir);

        // Generate configurations
        const dockerfile = generator.generate(projectInfo, {
          ...config,
          environment: envInfo.environment
        });

        const dockerCompose = generator.generateCompose(projectInfo, {
          ...config,
          environment: envInfo.environment
        });

        // Save configuration for future use
        if (options.interactive) {
          await configManager.saveConfig(dir, config);
        }

        // Write files
        await fs.writeFile(path.join(dir, 'Dockerfile'), dockerfile);
        await fs.writeFile(path.join(dir, 'docker-compose.yml'), dockerCompose);

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

  return [analyzeCommand, generateCommand];
}
