# Configuration Guide

This guide explains how to configure DevEnvBootstrap (DEB) for your projects.

## Quick Start

1. Create a `.devenvrc.json` in your project root:
```json
{
  "docker": {
    "mode": "development",
    "port": 3000
  }
}
```

2. Or use interactive configuration:
```bash
deb express generate -i
```

## Configuration File Locations

DEB looks for configuration in these locations (in order):

1. Command line specified path (`--config path/to/config.json`)
2. Project directory (`.devenvrc.json`)
3. User home directory (`~/.devenvrc.json`)
4. System-wide (`/etc/devenvbootstrap/config.json`)

## Basic Configuration

### Setting Output Format

Choose how DEB displays information:

```json
{
  "outputFormat": "simple"  // or "json", "table"
}
```

### Setting Timeouts

Configure operation timeouts:

```json
{
  "timeout": 30000,  // milliseconds
  "batchSize": 10
}
```

### Excluding Files

Specify patterns to ignore:

```json
{
  "excludePatterns": [
    "node_modules",
    ".git",
    "dist"
  ]
}
```

## Docker Configuration

### Development Mode

Configuration for local development:

```json
{
  "docker": {
    "mode": "development",
    "port": 3000,
    "nodeVersion": "18-alpine",
    "volumes": [
      "./src:/app/src"
    ]
  }
}
```

### Production Mode

Optimized for production:

```json
{
  "docker": {
    "mode": "production",
    "port": 80,
    "nodeVersion": "18-alpine",
    "networks": [
      "production-net"
    ]
  }
}
```

## Environment Configuration

### Setting Variables

Define environment variables:

```json
{
  "environment": {
    "variables": {
      "NODE_ENV": "development",
      "LOG_LEVEL": "debug"
    }
  }
}
```

### Configuring Services

Set up required services:

```json
{
  "services": [
    {
      "name": "Database",
      "type": "mongodb",
      "required": true,
      "config": {
        "version": "latest",
        "port": 27017
      }
    }
  ]
}
```

## Advanced Configuration

### Using Environment Variables

Override configuration with environment variables:

```bash
export DEB_CONFIG=/path/to/config.json
export DEB_DOCKER_MODE=production
```

### Multiple Environments

Create environment-specific configs:

```
project/
├── .devenvrc.json
├── .devenvrc.development.json
└── .devenvrc.production.json
```

### Network Configuration

Configure Docker networks:

```json
{
  "docker": {
    "networks": [
      {
        "name": "backend",
        "driver": "bridge"
      },
      {
        "name": "frontend",
        "driver": "overlay"
      }
    ]
  }
}
```

## Best Practices

1. **Version Control**
   - Commit `.devenvrc.json` for shared settings
   - Use `.devenvrc.local.json` for personal overrides

2. **Environment Variables**
   - Use environment variables for sensitive data
   - Keep development-specific settings in `.env`

3. **Docker Volumes**
   - Map source code for development
   - Use named volumes for persistence

4. **Service Configuration**
   - Define all required services
   - Specify version constraints

## Troubleshooting

### Common Issues

1. Configuration not loading:
   - Check file permissions
   - Verify JSON syntax
   - Check file location

2. Docker issues:
   - Verify port availability
   - Check volume paths
   - Confirm network exists

### Validation

DEB validates your configuration:

```bash
deb config validate
```

## Examples

### Basic Express.js Project

```json
{
  "docker": {
    "mode": "development",
    "port": 3000,
    "nodeVersion": "18-alpine"
  }
}
```

### Full-Stack Application

```json
{
  "docker": {
    "mode": "development",
    "services": [
      {
        "name": "api",
        "port": 3000
      },
      {
        "name": "client",
        "port": 8080
      }
    ],
    "networks": ["app-network"]
  }
}
```

### Production Setup

```json
{
  "docker": {
    "mode": "production",
    "port": 80,
    "nodeVersion": "18-alpine",
    "networks": ["production-net"],
    "volumes": ["data:/app/data"]
  },
  "environment": {
    "variables": {
      "NODE_ENV": "production"
    }
  }
}
```

## See Also

- [CLI Reference](../../api/cli.md)
- [Docker Guide](./docker.md)
- [Getting Started](./getting-started.md)
