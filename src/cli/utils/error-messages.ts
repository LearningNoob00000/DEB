// src/cli/utils/error-messages.ts
export const ErrorMessages = {
  CONFIG_LOAD: 'Failed to load configuration file',
  CONFIG_SAVE: 'Failed to save configuration file',
  CONFIG_INVALID: 'Invalid configuration:',
  DOCKER_GENERATION: 'Failed to generate Docker configuration',
  PROJECT_ANALYSIS: 'Failed to analyze project',
  VALIDATION: {
    PORT: 'Invalid port number. Must be between 1 and 65535',
    VOLUME: 'Invalid volume mount syntax. Use format: source:target',
    MODE: 'Invalid mode. Must be either "development" or "production"'
  }
} as const;
