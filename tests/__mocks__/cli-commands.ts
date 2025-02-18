// tests/__mocks__/cli-commands.ts
import { Command } from 'commander';

// Mock Commander Command class with working parseAsync
export class MockCommand extends Command {
  // Add private property for action handler
  private actionHandler: ((...args: any[]) => any) | null = null;
  
  // Override action to store the handler
  action(fn: (...args: any[]) => any) {
    this.actionHandler = fn;
    return this;
  }

  // Mock implementation that calls the handler
  async parseAsync(argv: string[]) {
    if (this.actionHandler) {
      // Extract args and options based on command configuration
      const args = argv.slice(2).filter(arg => !arg.startsWith('-'));
      const options = {};
      await this.actionHandler(args[0], options);
    }
    return this;
  }
}

// Create express commands mock
export function createExpressCommandsMock() {
  // Fix: Return an actual array for proper destructuring
  return [
    new Command('analyze')
      .description('Analyze Express.js project')
      .argument('[dir]', 'Project directory', '.')
      .option('--json', 'Output as JSON'),
      
    new Command('generate')
      .description('Generate Docker configuration')
      .argument('[dir]', 'Project directory', '.')
      .option('-d, --dev', 'Generate development configuration')
      .option('-p, --port <number>', 'Override port number')
      .option('--node-version <version>', 'Specify Node.js version')
      .option('-i, --interactive', 'Use interactive configuration')
  ];
}