#!/usr/bin/env node

import { Command } from 'commander';
import { createScanCommand } from './commands/scan';
import { createAnalyzeCommand } from './commands/analyze';
import { createExpressCommands } from './commands/express-commands';

export const createCLI = (): Command => {
  const program = new Command()
    .name('deb')
    .description('Development environment bootstrapping tool')
    .version('1.0.0-beta.7');

  // Add scan and analyze commands
  program.addCommand(createScanCommand());
  program.addCommand(createAnalyzeCommand());

  // Add Express.js commands
  createExpressCommands().forEach(cmd => program.addCommand(cmd));

  return program;
};

// When running as a script (not imported as a module)
if (require.main === module) {
  const program = createCLI();
  program.parse(process.argv);
}