# DevEnvBootstrap (DEB)

[![GitHub license](https://img.shields.io/github/license/LearningNoob00000/DEB)](https://github.com/LearningNoob00000/DEB/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/dev-env-bootstrap.svg)](https://www.npmjs.com/package/dev-env-bootstrap)
[![Build Status](https://github.com/LearningNoob00000/DEB/workflows/CI/badge.svg)](https://github.com/LearningNoob00000/DEB/actions)
[![semantic-release: beta](https://img.shields.io/badge/semantic--release-beta-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

> 🚀 Automated development environment bootstrapping tool for Node.js projects, with a focus on Express.js applications.

## Features

- 🔍 **Project Analysis**: Auto-detect project structure and dependencies
- 🐳 **Docker Configuration**: Generate Dockerfiles and docker-compose configurations
- 🛠️ **Service Detection**: Automatically detect and configure required services
- ⚡ **Quick Setup**: Get your development environment running in minutes
- 🔄 **Environment Handling**: Smart environment variable management

## Installation

```bash
# Install globally (beta version)
npm install -g dev-env-bootstrap@beta

# Or use it directly with npx
npx dev-env-bootstrap@beta
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
deb express generate \\
  --dev \\
  --port 3000 \\
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
    "nodeVersion": "20-alpine"
  }
}
```

## Features in Beta

- 🔄 Multi-container orchestration
- 📊 Project analysis reporting
- 🔐 Service configuration management
- 📝 Documentation generation
- 🧪 Test environment setup

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/LearningNoob00000/DEB.git
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
- 🐛 [Issue Tracker](https://github.com/LearningNoob00000/DEB/issues)
- 💬 [Discussions](https://github.com/LearningNoob00000/DEB/discussions)

## Project Status

Current Version: ![npm version](https://img.shields.io/npm/v/dev-env-bootstrap/beta)

| Feature             | Status |
|--------------------|--------|
| Project Analysis   | ✅     |
| Docker Generation  | ✅     |
| Service Detection  | ✅     |
| TypeScript Support | ✅     |
| Documentation      | 🔄     |
| Test Coverage      | 🔄     |

## Acknowledgments

Special thanks to all our contributors and the following open-source projects:
- [Commander.js](https://github.com/tj/commander.js)
- [TypeScript](https://www.typescriptlang.org/)
- [Docker](https://www.docker.com/)
