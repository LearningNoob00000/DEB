export interface DockerGeneratorConfig {
  environment?: {
    variables: Record<string, string>;
    hasEnvFile: boolean;
    services: Array<{ name: string; url: string; required: boolean }>;
  };
  nodeVersion: string;
  port: number;
  hasTypeScript: boolean;
  isDevelopment: boolean;
}
