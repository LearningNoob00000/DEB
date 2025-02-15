# Microservices Example

This example demonstrates how to use DevEnvBootstrap with a microservices architecture using Express.js.

## Project Structure

```
microservices/
├── gateway/                 # API Gateway service
│   ├── src/
│   │   ├── routes/
│   │   └── app.ts
│   └── package.json
├── auth-service/           # Authentication service
│   ├── src/
│   │   ├── routes/
│   │   └── app.ts
│   └── package.json
├── user-service/          # User management service
│   ├── src/
│   │   ├── routes/
│   │   └── app.ts
│   └── package.json
├── product-service/       # Product management service
│   ├── src/
│   │   ├── routes/
│   │   └── app.ts
│   └── package.json
└── docker-compose.yml
```

## Service Descriptions

### API Gateway
- Routes requests to appropriate services
- Handles request/response transformation
- Implements rate limiting and caching
- Port: 3000

### Auth Service
- Manages user authentication
- Handles JWT tokens
- Integrates with Redis for session management
- Port: 3001

### User Service
- Manages user profiles
- Handles user CRUD operations
- Uses MongoDB for data storage
- Port: 3002

### Product Service
- Manages product catalog
- Handles inventory
- Uses PostgreSQL for data storage
- Port: 3003

## Setup Instructions

1. Initialize project structure:
```bash
mkdir microservices && cd microservices
for dir in gateway auth-service user-service product-service; do
  mkdir -p $dir/src/routes
done
```

2. Generate Docker configuration:
```bash
deb express generate -i
```

## Service Implementation

### API Gateway (gateway/src/app.ts)
```typescript
import express from 'express';
import proxy from 'express-http-proxy';

const app = express();

// Route to services
app.use('/auth', proxy('http://auth-service:3001'));
app.use('/users', proxy('http://user-service:3002'));
app.use('/products', proxy('http://product-service:3003'));

export default app;
```

### Auth Service (auth-service/src/app.ts)
```typescript
import express from 'express';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';

const app = express();
const redis = new Redis('redis://redis:6379');

app.post('/login', async (req, res) => {
  // Authentication logic
  const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET!);
  await redis.set(`session:${token}`, 'active');
  res.json({ token });
});

export default app;
```

### User Service (user-service/src/app.ts)
```typescript
import express from 'express';
import mongoose from 'mongoose';

const app = express();

mongoose.connect('mongodb://mongodb:27017/users');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String
});

const User = mongoose.model('User', UserSchema);

app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

export default app;
```

### Product Service (product-service/src/app.ts)
```typescript
import express from 'express';
import { Pool } from 'pg';

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.get('/products', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products');
  res.json(rows);
});

export default app;
```

## Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  gateway:
    build: ./gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    depends_on:
      - auth-service
      - user-service
      - product-service

  auth-service:
    build: ./auth-service
    environment:
      - NODE_ENV=development
      - JWT_SECRET=your-secret-key
    depends_on:
      - redis

  user-service:
    build: ./user-service
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/users
    depends_on:
      - mongodb

  product-service:
    build: ./product-service
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:password@postgres:5432/products
    depends_on:
      - postgres

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  postgres:
    image: postgres:latest
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  mongodb_data:
  postgres_data:
```

## Development

1. Start all services:
```bash
docker compose up -d
```

2. View service logs:
```bash
docker compose logs -f gateway
```

3. Test the API:
```bash
# Auth
curl -X POST http://localhost:3000/auth/login

# Users
curl http://localhost:3000/users

# Products
curl http://localhost:3000/products
```

## Service Communication

### Inter-service Communication
```typescript
// User service calling Auth service
const response = await fetch('http://auth-service:3001/validate', {
  headers: { 'Authorization': token }
});
```

### Event-driven Communication
```typescript
// Using RabbitMQ for events
import amqp from 'amqplib';

const connection = await amqp.connect('amqp://rabbitmq');
const channel = await connection.createChannel();

// Publish event
await channel.publish('user_events', 'user.created', Buffer.from(JSON.stringify(user)));

// Subscribe to event
await channel.consume('product_updates', (msg) => {
  const product = JSON.parse(msg!.content.toString());
  // Handle product update
});
```

## Monitoring and Logging

### Health Checks
```typescript
// In each service
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'user-service'
  });
});
```

### Logging
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Testing

### Integration Tests
```typescript
// tests/integration/user-service.test.ts
import request from 'supertest';
import app from '../src/app';

describe('User Service', () => {
  it('should create a new user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(response.status).toBe(201);
  });
});
```

## Production Deployment

1. Build production images:
```bash
docker compose -f docker-compose.prod.yml build
```

2. Deploy services:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## See Also

- [Basic Express Example](../basic-express/README.md)
- [TypeScript Example](../typescript/README.md)
- [Docker Guide](../../guides/docker.md)
