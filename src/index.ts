// src/index.ts
import { Command } from 'commander';
import { createScanCommand } from './cli/commands/scan';
import { createAnalyzeCommand } from './cli/commands/analyze';
import { createExpressCommands } from './cli/commands/express-commands';

export const createCLI = (): Command => {
  const program = new Command()
    .name('dev-env-bootstrap')
    .description('Development environment bootstrapping tool')
    .version('0.1.0');

  // Add commands
  program.addCommand(createScanCommand());
  program.addCommand(createAnalyzeCommand());
  createExpressCommands().forEach(cmd => program.addCommand(cmd));

  return program;
};

// Add bootstrap function for programmatic usage
export const bootstrap = (): void => {
  console.log('DevEnvBootstrap initialized');
};
