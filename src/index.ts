// src/index.ts
import { createCLI } from './cli';

// Export the CLI creation function for programmatic usage
export { createCLI };

// Add bootstrap function for programmatic usage
export const bootstrap = (): void => {
  console.log('DevEnvBootstrap initialized');
};
