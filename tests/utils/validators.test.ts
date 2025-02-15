// tests/utils/validators.test.ts
import { ConfigValidators } from '../../src/cli/utils/validators';

describe('ConfigValidators', () => {
  describe('validatePort', () => {
    it('should validate valid port numbers', () => {
      expect(ConfigValidators.validatePort(3000)).toBe(true);
      expect(ConfigValidators.validatePort(80)).toBe(true);
      expect(ConfigValidators.validatePort(65535)).toBe(true);
    });

    it('should invalidate invalid port numbers', () => {
      expect(ConfigValidators.validatePort(-1)).toBe(false);
      expect(ConfigValidators.validatePort(0)).toBe(false);
      expect(ConfigValidators.validatePort(65536)).toBe(false);
    });
  });

  describe('validateVolumeSyntax', () => {
    it('should validate correct volume syntax', () => {
      expect(ConfigValidators.validateVolumeSyntax('./data:/app/data')).toBe(true);
      expect(ConfigValidators.validateVolumeSyntax('/host/path:/container/path')).toBe(true);
    });

    it('should invalidate incorrect volume syntax', () => {
      expect(ConfigValidators.validateVolumeSyntax('invalid-volume')).toBe(false);
      expect(ConfigValidators.validateVolumeSyntax('')).toBe(false);
      expect(ConfigValidators.validateVolumeSyntax('only-one-part')).toBe(false);
    });
  });

  describe('validateDockerConfig', () => {
    it('should validate correct configuration', () => {
      const validConfig = {
        mode: 'development' as const,
        port: 3000,
        nodeVersion: '18-alpine',
        volumes: ['./data:/app/data'],
        networks: []
      };

      const errors = ConfigValidators.validateDockerConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const invalidConfig = {
        mode: 'invalid' as any,
        port: -1,
        nodeVersion: '18-alpine',
        volumes: ['invalid-volume'],
        networks: []
      };

      const errors = ConfigValidators.validateDockerConfig(invalidConfig);
      expect(errors).toContain('Invalid port number. Must be between 1 and 65535.');
      expect(errors).toContain('Mode must be either "development" or "production"');
      expect(errors).toContain('Invalid volume syntax at index 0: invalid-volume');
    });
  });
});
