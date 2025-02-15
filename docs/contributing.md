# Contributing to DevEnvBootstrap

Thank you for your interest in contributing to DevEnvBootstrap! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/dev-env-bootstrap.git
cd dev-env-bootstrap
```

3. Install dependencies:
```bash
npm install
```

4. Create a branch:
```bash
git checkout -b feature/your-feature-name
```

## Development Setup

### Prerequisites

- Node.js >= 16
- npm >= 7
- Docker and Docker Compose
- Git

### Environment Setup

1. Copy environment template:
```bash
cp .env.example .env
```

2. Set up development configuration:
```bash
npm run setup:dev
```

## Development Workflow

1. Make your changes
2. Write or update tests
3. Run tests:
```bash
npm test
```

4. Run linting:
```bash
npm run lint
```

5. Build the project:
```bash
npm run build
```

## Commit Guidelines

We use conventional commits. Each commit message should have a structured format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(docker): add multi-stage build support

Add multi-stage build configuration to optimize production images.
Includes:
- Base stage for dependencies
- Build stage for TypeScript compilation
- Production stage for minimal runtime
```

## Pull Request Process

1. Update documentation for new features
2. Add or update tests
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Submit PR with detailed description

### PR Title Format

Follow the same convention as commit messages:
```
feat(scope): brief description
```

### PR Description Template

```markdown
## Description
[Describe your changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
[Describe testing approach]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Code follows project style
```

## Testing Guidelines

### Unit Tests

- Place in `tests/unit/`
- One test file per source file
- Follow naming convention: `*.test.ts`
- Use Jest's describe/it syntax

Example:
```typescript
describe('UserService', () => {
  describe('create', () => {
    it('should create new user', async () => {
      // test code
    });
  });
});
```

### Integration Tests

- Place in `tests/integration/`
- Test service interactions
- Use actual database when necessary

### E2E Tests

- Place in `tests/e2e/`
- Test complete workflows
- Use real Docker environment

## Documentation Guidelines

### Code Documentation

- Use JSDoc comments for functions and classes
- Include type information
- Provide examples for complex functionality

Example:
```typescript
/**
 * Creates Docker configuration for Express.js project
 * @param projectInfo - Project analysis results
 * @param config - Docker configuration options
 * @returns Generated Dockerfile content
 * @throws {ConfigError} If configuration is invalid
 */
generate(projectInfo: ProjectInfo, config: DockerConfig): string
```

### README Updates

- Keep installation instructions updated
- Document new features
- Include example usage
- Update troubleshooting guide

## Release Process

1. Update version:
```bash
npm version [major|minor|patch]
```

2. Update CHANGELOG.md
3. Create release PR
4. After merge, create GitHub release
5. Publish to npm:
```bash
npm publish
```

## Reporting Issues

### Bug Reports

Include:
- DevEnvBootstrap version
- Node.js version
- Docker version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternative solutions considered
- Example usage

## Additional Resources

- [Development Guide](docs/guides/development.md)
- [Architecture Overview](docs/guides/architecture.md)
- [Testing Guide](docs/guides/testing.md)
- [Style Guide](docs/guides/style.md)

## Getting Help

- Join our Discord server
- Check existing issues
- Ask questions in Discussions
- Read the FAQ

## License

By contributing, you agree that your contributions will be licensed under the project's license.
