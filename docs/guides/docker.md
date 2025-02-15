# Docker Features Guide

This guide explains the Docker-related features in DevEnvBootstrap and how to use them effectively.

## Quick Start

Generate Docker configuration for your Express.js project:

```bash
deb express generate -i
```

This will create:
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

## Development Mode

### Basic Development Setup

1. Generate development configuration:
```bash
deb express generate --dev
```

2. Start development environment:
```bash
docker compose up
```

Features:
- Hot reloading
- Source code mounting
- Development dependencies included
- Debug port exposed
- Node.js inspector enabled

### Development Optimizations

- Faster builds with cached node_modules
- Source maps enabled
- Watch mode for TypeScript compilation
- Development-specific environment variables

## Production Mode

### Production Setup

1. Generate production configuration:
```bash
deb express generate --prod
```

2. Build and run:
```bash
docker compose -f docker-compose.prod.yml up --build
```

Features:
- Multi-stage builds
- Optimized final image
- Production-only dependencies
- Security hardening

### Production Optimizations

- Minimal final image size
- Security best practices
- Performance tuning
- Health checks

## Service Integration

### Database Services

MongoDB example:
```yaml
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
```

PostgreSQL example:
```yaml
services:
  postgres:
    image: postgres:latest
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

### Cache Services

Redis example:
```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Message Queues

RabbitMQ example:
```yaml
services:
  rabbitmq:
    image: rabbitmq:management
    ports:
      - "5672:5672"
      - "15672:15672"
```

## Volume Management

### Development Volumes

```yaml
volumes:
  - ./src:/app/src
  - ./package.json:/app/package.json
  - node_modules:/app/node_modules
```

### Production Volumes

```yaml
volumes:
  - data:/app/data
  - logs:/app/logs
  - uploads:/app/uploads
```

## Network Configuration

### Basic Networking

```yaml
networks:
  backend:
    driver: bridge
  frontend:
    driver: bridge
```

### Service Networks

```yaml
services:
  api:
    networks:
      - backend
  web:
    networks:
      - frontend
      - backend
```

## Environment Variables

### Development Environment

```dockerfile
ENV NODE_ENV=development
ENV DEBUG=app:*
```

### Production Environment

```dockerfile
ENV NODE_ENV=production
ENV PORT=80
```

## Security Features

### Development Security

- CORS configuration
- Development SSL certificates
- Basic authentication

### Production Security

- Non-root user
- Read-only filesystem
- Security headers
- Limited exposure

## TypeScript Support

### Development Build

```dockerfile
RUN npm install
COPY tsconfig.json .
RUN npm run build -- --watch
```

### Production Build

```dockerfile
RUN npm install
COPY tsconfig.json .
RUN npm run build
```

## Debugging

### Development Debugging

1. Enable inspector:
```dockerfile
ENV NODE_OPTIONS='--inspect=0.0.0.0:9229'
```

2. Configure VS Code:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Docker: Attach to Node",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app"
    }
  ]
}
```

## Health Checks

### Basic Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:${PORT}/health || exit 1
```

### Advanced Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node healthcheck.js
```

## Best Practices

### Development

1. Use volume mounts for:
   - Source code
   - Configuration files
   - Node modules

2. Enable:
   - Hot reloading
   - Source maps
   - Debug ports

### Production

1. Implement:
   - Multi-stage builds
   - Security measures
   - Health checks
   - Logging

2. Optimize:
   - Image size
   - Build time
   - Runtime performance

## Troubleshooting

### Common Issues

1. Volume permissions:
```bash
# Fix node_modules permissions
chmod -R 777 node_modules/
```

2. Port conflicts:
```bash
# Find process using port
lsof -i :3000
```

3. Cache issues:
```bash
# Clean Docker build cache
docker builder prune
```

## Examples

### Basic Express.js

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    environment:
      - NODE_ENV=development
```

### Full Stack Application

```yaml
version: '3.8'
services:
  api:
    build: ./api
    ports:
      - "3000:3000"
  client:
    build: ./client
    ports:
      - "8080:80"
  db:
    image: mongodb
```

### Microservices

```yaml
version: '3.8'
services:
  auth:
    build: ./auth
    ports:
      - "3001:3001"
  users:
    build: ./users
    ports:
      - "3002:3002"
  gateway:
    build: ./gateway
    ports:
      - "3000:3000"
```

## See Also

- [Docker API Reference](../../api/docker.md)
- [Configuration Guide](./configuration.md)
- [Example Projects](../examples/)
