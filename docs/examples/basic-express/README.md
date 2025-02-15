# Basic Express.js Example

This example demonstrates how to use DevEnvBootstrap with a basic Express.js application.

## Project Structure

```
basic-express/
├── src/
│   ├── routes/
│   │   ├── index.ts
│   │   └── users.ts
│   ├── middleware/
│   │   └── error.ts
│   └── app.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

1. Create a new directory:
```bash
mkdir basic-express
cd basic-express
```

2. Initialize the project:
```bash
npm init -y
```

3. Install dependencies:
```bash
npm install express cors helmet
npm install --save-dev typescript @types/express @types/node
```

4. Create TypeScript configuration:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

5. Set up environment:
```env
# .env
PORT=3000
NODE_ENV=development
```

## Application Code

### src/app.ts
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import errorMiddleware from './middleware/error';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// Error handling
app.use(errorMiddleware);

export default app;
```

### src/routes/index.ts
```typescript
import { Router } from 'express';
import userRoutes from './users';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/users', userRoutes);

export default router;
```

### src/routes/users.ts
```typescript
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' }
  ]);
});

export default router;
```

## Using DevEnvBootstrap

1. Install DevEnvBootstrap:
```bash
npm install -g dev-env-bootstrap
```

2. Generate Docker configuration:
```bash
deb express generate -i
```

3. Start the development environment:
```bash
docker compose up -d
```

## Docker Configuration

### Dockerfile
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
COPY . .
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

FROM base AS production
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      target: development
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3000
```

## Development

### Scripts in package.json
```json
{
  "scripts": {
    "start": "node dist/app.js",
    "dev": "ts-node-dev --respawn src/app.ts",
    "build": "tsc",
    "test": "jest"
  }
}
```

### Running the Application

1. Development mode:
```bash
docker compose up
```

2. Access the API:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/users
```

## Testing

Add Jest configuration and tests:

```typescript
// src/__tests__/app.test.ts
import request from 'supertest';
import app from '../app';

describe('App', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
```

Run tests:
```bash
docker compose exec app npm test
```

## Production Deployment

1. Build production image:
```bash
docker compose -f docker-compose.prod.yml build
```

2. Run production container:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## Advanced Features

### 1. Error Handling

```typescript
// src/middleware/error.ts
import { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
};

export default errorHandler;
```

### 2. Request Validation

```typescript
import { Request, Response, NextFunction } from 'express';

const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  next();
};
```

### 3. Database Integration

```typescript
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/app');
```

## Next Steps

1. Add authentication
2. Implement database models
3. Add API documentation
4. Set up CI/CD pipeline

## See Also

- [TypeScript Example](../typescript/README.md)
- [Microservices Example](../microservices/README.md)
- [Docker Guide](../../guides/docker.md)
