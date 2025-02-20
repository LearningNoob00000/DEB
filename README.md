# DevEnvBootstrap (DEB)

[![GitHub license](https://img.shields.io/github/license/SpongeBUG/DEB)](https://github.com/SpongeBUG/DEB/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/deb-tool/beta.svg)](https://www.npmjs.com/package/deb-tool)
[![Build Status](https://github.com/SpongeBUG/DEB/workflows/CI/badge.svg?branch=master)](https://github.com/SpongeBUG/DEB/actions)
[![semantic-release: beta](https://img.shields.io/badge/semantic--release-beta-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Test Coverage](https://img.shields.io/badge/coverage-82%25-brightgreen.svg)](https://github.com/SpongeBUG/DEB/actions)

> 🚀 A comprehensive CLI tool for automatically bootstrapping Docker-based development environments for Node.js/Express projects. Analyzes project structure, detects required services, and generates optimized configurations for both development and production environments.

## Features

- 🔍 **Smart Project Analysis**: Auto-detect project structure, dependencies, and required services
- 🐳 **Docker Configuration**: Generate optimized Dockerfiles and docker-compose configurations
- 🛠️ **Service Integration**: Automatically configure MongoDB, Redis, RabbitMQ and other services
- ⚡ **TypeScript Support**: First-class support for TypeScript projects
- 🔄 **Environment Management**: Intelligent environment variable detection and configuration
- 🔒 **Production Ready**: Generate secure configurations for production deployment

## Installation

```bash
# Install globally
npm install -g deb-tool@beta

# Or use it directly with npx
npx deb-tool@beta
```

## Quick Start

```bash
# Scan your project
deb scan

# Analyze your project structure
deb analyze

# For Express.js projects
deb express analyze
deb express generate -i  # Interactive mode
```

## Commands

### Project Analysis
- `deb scan [dir]` - Scan project directory for Express.js setup
- `deb analyze [dir]` - Analyze project structure and dependencies

### Express.js Commands
- `deb express analyze [dir]` - Analyze Express.js project
  - Options:
    - `--json` - Output results as JSON

- `deb express generate [dir]` - Generate Docker configuration
  - Options:
    - `-d, --dev` - Generate development configuration
    - `-p, --port <number>` - Override port number
    - `--node-version <version>` - Specify Node.js version
    - `-i, --interactive` - Use interactive configuration

## Example Usage

### Basic Express.js Project

```bash
# Create a new project
mkdir my-express-app && cd my-express-app
npm init -y

# Install Express.js
npm install express

# Generate Docker configuration
deb express generate -i

# Start development environment
docker compose up -d
```

### With TypeScript and Services

```bash
# Analyze project
deb express analyze

# Generate Docker configuration with custom settings
deb express generate \
  --dev \
  --port 3000 \
  --node-version 20-alpine
```

## Configuration

DEB supports various configuration options through:

- Interactive prompts (`-i` flag)
- Command line arguments
- Configuration file (`.devenvrc.json`)

Example configuration:
```json
{
  "docker": {
    "mode": "development",
    "port": 3000,
    "nodeVersion": "20-alpine",
    "volumes": ["./src:/app/src"]
  }
}
```

## Documentation

### API References
- [CLI API Reference](docs/api/api_cli.md)
- [Configuration API Reference](docs/api/api_config.md)
- [Docker API Reference](docs/api/api_docker.md)

### Guides
- [Getting Started Guide](docs/guides/getting-started.md)
- [Configuration Guide](docs/guides/configuration.md)
- [Docker Features Guide](docs/guides/docker.md)
- [Architecture Guide](docs/guides/architecture.md)

### Examples
- [Basic Express.js Example](docs/examples/basic-express_README.md)
- [TypeScript Example](docs/examples/typescript_README.md)
- [Microservices Example](docs/examples/microservices_README.md)

## Project Status

Current Version: [![npm version](https://img.shields.io/npm/v/deb-tool/beta.svg)](https://www.npmjs.com/package/deb-tool)

| Feature                | Status |
|------------------------|--------|
| Project Analysis       | ✅     |
| Docker Generation      | ✅     |
| Service Detection      | ✅     |
| TypeScript Support     | ✅     |
| Interactive Config     | ✅     |
| Environment Handling   | ✅     |
| Test Coverage (82%)    | ✅     |
| Multi-service Support  | ✅     |
| Binaries (Win/Mac/Linux) | ✅   |
| Documentation          | ✅     |
| Error Handling         | ✅     |

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/docs_contributing.md) for details.

```bash
# Clone the repository
git clone https://github.com/SpongeBUG/DEB.git
cd DEB

# Install dependencies
npm install

# Run tests
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/SpongeBUG/DEB/issues)
- 💬 [Discussions](https://github.com/SpongeBUG/DEB/discussions)

## Acknowledgments

Special thanks to all contributors and these amazing open-source projects:
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Docker](https://www.docker.com/) - Containerization
- [Jest](https://jestjs.io/) - Testing framework
- [Semantic Release](https://semantic-release.gitbook.io/) - Release automation

---

Built with ❤️ by the SpongeBUG team