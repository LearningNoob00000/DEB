# Getting Started with DevEnvBootstrap

This guide will help you get started with DevEnvBootstrap (DEB), a tool for automatically setting up development environments for Node.js projects.

## Installation

Install DevEnvBootstrap globally using npm:

```bash
npm install -g dev-env-bootstrap
```

Or using yarn:

```bash
yarn global add dev-env-bootstrap
```

## Basic Usage

### 1. Project Analysis

Analyze your existing Express.js project:

```bash
deb analyze ./my-project
```

This will:
- Detect project type
- Identify dependencies
- Analyze environment configuration
- Detect required services

### 2. Environment Setup

Generate Docker configuration:

```bash
deb express generate -i
```

The `-i` flag enables interactive mode, which will:
- Ask for your preferences
- Configure development settings
- Set up required services
- Create necessary configuration files

### 3. Starting Development

Start your development environment:

```bash
docker compose up
```

## Project Structure

A typical DEB-configured project looks like this:

```
my-project/
├── .devenvrc.json        # DEB configuration
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Service orchestration
├── .env                  # Environment variables
├── .env.example          # Environment template
└── package.json          # Node.js configuration
```

## Configuration

### Basic Configuration

Create a `.devenvrc.json` in your project root:

```json
{
  "docker": {
    "mode": "development",
    "port": 3000
  }
}
```

### Environment Variables

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development
DB_URL=mongodb://localhost:27017
```

## Working with Services

### 1. Service Detection

DEB automatically detects services from your environment:

```env
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
```

### 2. Service Configuration

Services are automatically added to `docker-compose.yml`:

```yaml
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## Development Workflow

### 1. Start Development

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f app
```

### 2. Making Changes

Changes to your source code are automatically reflected due to volume mounting:

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

### 3. Adding Dependencies

Install new dependencies:

```bash
# Install a new package
npm install express

# Rebuild container
docker compose up -d --build
```

## Common Tasks

### Analyzing Project

```bash
# Basic analysis
deb analyze

# Detailed JSON output
deb analyze --json
```

### Managing Services

```bash
# Start specific service
docker compose up mongodb -d

# View service logs
docker compose logs redis

# Reset service data
docker compose down -v
```

### Updating Configuration

```bash
# Regenerate Docker configuration
deb express generate -i

# Update existing configuration
deb express generate --dev --port 8080
```

## Next Steps

1. Explore [example projects](../examples/)
2. Read the [Docker guide](./docker.md)
3. Learn about [configuration options](./configuration.md)

## Troubleshooting

### Common Issues

1. Port conflicts:
```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Maps container port 3000 to host port 3001
```

2. Permission issues:
```bash
# Fix volume permissions
sudo chown -R $USER:$USER .
```

3. Cache problems:
```bash
# Clear Docker cache
docker compose build --no-cache
```

## Getting Help

- Run `deb --help` for command information
- Check [documentation](../../README.md)
- File issues on GitHub

## See Also

- [CLI Reference](../../api/cli.md)
- [Docker Guide](./docker.md)
- [Configuration Guide](./configuration.md)
