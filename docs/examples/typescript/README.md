# TypeScript Example

This example demonstrates how to use DevEnvBootstrap with a TypeScript-based Express.js application, including advanced TypeScript features and best practices.

## Project Structure

```
typescript-example/
├── src/
│   ├── controllers/
│   │   ├── user.controller.ts
│   │   └── auth.controller.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   └── auth.model.ts
│   ├── services/
│   │   ├── user.service.ts
│   │   └── auth.service.ts
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── auth.middleware.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── database.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   └── environment.d.ts
│   ├── routes/
│   │   ├── user.routes.ts
│   │   └── auth.routes.ts
│   └── app.ts
├── tests/
│   ├── integration/
│   │   └── user.test.ts
│   └── unit/
│       └── user.service.test.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

1. Initialize project:
```bash
mkdir typescript-example && cd typescript-example
npm init -y
```

2. Install dependencies:
```bash
npm install express cors helmet mongoose winston
npm install --save-dev typescript @types/express @types/node @types/cors
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

3. Configure TypeScript:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "typeRoots": ["./src/types", "./node_modules/@types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## Type Definitions

### src/types/express.d.ts
```typescript
import { User } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
```

### src/types/environment.d.ts
```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
  }
}
```

## Models and Interfaces

### src/models/user.model.ts
```typescript
import { Document, Schema, model } from 'mongoose';

export interface IUser {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<IUserDocument>('User', UserSchema);
```

## Services

### src/services/user.service.ts
```typescript
import { IUser, User } from '../models/user.model';

export class UserService {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  async update(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updates, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return result !== null;
  }
}
```

## Controllers

### src/controllers/user.controller.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.userService.findById(req.params.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json(user);
    } catch (error) {
      logger.error('Error in getUser:', error);
      next(error);
    }
  };
}
```

## Middleware

### src/middleware/error.middleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error:', err);

  res.status(err.statusCode || 500).json({
    message: err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
};
```

## Routes

### src/routes/user.routes.ts
```typescript
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateUser } from '../middleware/validation.middleware';

const router = Router();
const userController = new UserController();

router.get('/:id', authMiddleware, userController.getUser);
router.post('/', validateUser, userController.createUser);
router.put('/:id', authMiddleware, validateUser, userController.updateUser);
router.delete('/:id', authMiddleware, userController.deleteUser);

export default router;
```

## Utils

### src/utils/logger.ts
```typescript
import winston from 'winston';

### src/utils/logger.ts
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### src/utils/database.ts
```typescript
import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
```

## Main Application

### src/app.ts
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './utils/database';
import { errorHandler } from './middleware/error.middleware';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
```

## Testing

### jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*): '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/types/**/*.ts'
  ]
};
```

### tests/unit/user.service.test.ts
```typescript
import { UserService } from '@/services/user.service';
import { User } from '@/models/user.model';

jest.mock('@/models/user.model');

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = { id: '1', name: 'Test User' };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findById('1');
      expect(result).toEqual(mockUser);
    });
  });
});
```

### tests/integration/user.test.ts
```typescript
import request from 'supertest';
import app from '@/app';
import { User } from '@/models/user.model';

describe('User API', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('GET /api/users/:id', () => {
    it('should return user if exists', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      });

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
    });
  });
});
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
CMD ["npm", "run", "dev"]

FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production
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
      - MONGODB_URI=mongodb://mongodb:27017/app
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

## Scripts in package.json
```json
{
  "scripts": {
    "start": "node dist/app.js",
    "build": "tsc",
    "dev": "ts-node-dev --respawn src/app.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix"
  }
}
```

## Development

1. Start development environment:
```bash
docker compose up -d
```

2. Watch logs:
```bash
docker compose logs -f app
```

3. Run tests:
```bash
docker compose exec app npm test
```

## Production

1. Build production image:
```bash
docker compose -f docker-compose.prod.yml build
```

2. Deploy:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## See Also

- [Basic Express Example](../basic-express/README.md)
- [Microservices Example](../microservices/README.md)
- [Docker Guide](../../guides/docker.md)
