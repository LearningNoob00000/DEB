// tests/cli/utils/error-messages.test.ts
import { ErrorMessages } from '../../../src/cli/utils/error-messages';

describe('ErrorMessages', () => {
  it('should export configuration error messages', () => {
    expect(ErrorMessages.CONFIG_LOAD).toBe('Failed to load configuration file');
    expect(ErrorMessages.CONFIG_SAVE).toBe('Failed to save configuration file');
    expect(ErrorMessages.CONFIG_INVALID).toBe('Invalid configuration:');
  });

  it('should export docker generation error messages', () => {
    expect(ErrorMessages.DOCKER_GENERATION).toBe('Failed to generate Docker configuration');
  });

  it('should export project analysis error messages', () => {
    expect(ErrorMessages.PROJECT_ANALYSIS).toBe('Failed to analyze project');
  });

  it('should export validation error messages', () => {
    expect(ErrorMessages.VALIDATION.PORT).toBe('Invalid port number. Must be between 1 and 65535');
    expect(ErrorMessages.VALIDATION.VOLUME).toBe('Invalid volume mount syntax. Use format: source:target');
    expect(ErrorMessages.VALIDATION.MODE).toBe('Invalid mode. Must be either "development" or "production"');
  });
});