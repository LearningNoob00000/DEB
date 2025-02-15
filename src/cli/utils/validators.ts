// src/cli/utils/validators.ts
import { DockerConfig } from './config-manager';

export class ConfigValidators {
  static validatePort(port: number): boolean {
    return port > 0 && port < 65536;
  }

  static validateVolumeSyntax(volume: string): boolean {
    const parts = volume.split(':');
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  }

  static validateDockerConfig(config: DockerConfig): string[] {
    const errors: string[] = [];

    if (!this.validatePort(config.port)) {
      errors.push('Invalid port number. Must be between 1 and 65535.');
    }

    config.volumes.forEach((volume, index) => {
      if (!this.validateVolumeSyntax(volume)) {
        errors.push(`Invalid volume syntax at index ${index}: ${volume}`);
      }
    });

    if (!['development', 'production'].includes(config.mode)) {
      errors.push('Mode must be either "development" or "production"');
    }

    return errors;
  }
}
