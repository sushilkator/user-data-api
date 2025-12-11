# User Data API - Microservices Architecture

Express.js microservices API with TypeScript, MongoDB, and Redis. Implements distributed caching, rate limiting, and service-oriented architecture.

## Architecture

This project follows a **microservices architecture** with three main services:

1. **API Gateway** (Port 3000) - Routes requests, handles rate limiting, and aggregates responses
2. **User Service** (Port 3001) - Manages user data with MongoDB
3. **Cache Service** (Port 3002) - Handles caching operations with Redis

## Prerequisites

- Node.js 18+
- MongoDB (running on localhost:27017)
- Redis (running on localhost:6379)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env` and configure:

```bash
MONGODB_URI=mongodb://localhost:27017/user-data-api
REDIS_URL=redis://localhost:6379
GATEWAY_PORT=3000
USER_SERVICE_PORT=3001
CACHE_SERVICE_PORT=3002
```

### 3. Start Services

**Option A: Start all services separately (recommended for development)**

```bash
# Terminal 1 - User Service
npm run dev:user-service

# Terminal 2 - Cache Service
npm run dev:cache-service

# Terminal 3 - API Gateway
npm run dev:gateway
```

**Option B: Build and start production**

```bash
npm run build
npm run start:user-service &
npm run start:cache-service &
npm run start:gateway
```

## API Endpoints

All requests go through the API Gateway at `http://localhost:3000`

### GET /users/:id
Get user by ID. Cached in Redis for 60 seconds.

```bash
curl http://localhost:3000/users/507f1f77bcf86cd799439011
```

### POST /users
Create a new user. Auto-cached in Redis.

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com"}'
```

### GET /users
Get all users.

```bash
curl http://localhost:3000/users
```

### GET /cache/status
Cache statistics (size, hits, misses, avg response time).

```bash
curl http://localhost:3000/cache/status
```

### DELETE /cache
Clear the cache.

```bash
curl -X DELETE http://localhost:3000/cache
```

### GET /health
Health check for API Gateway.

```bash
curl http://localhost:3000/health
```

## Technology Stack

### Backend
- **Node.js** + **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** + **Mongoose** - Database
- **Redis** - Caching and rate limiting

### Testing
- **Mocha** - Test framework
- **Chai** - Assertion library
- **Supertest** - HTTP testing

## Project Structure

```
user-data-api/
├── api-gateway/          # API Gateway service
│   ├── config/           # Redis configuration
│   ├── middleware/       # Rate limiter, metrics
│   ├── routes/           # Route handlers
│   └── services/         # Service clients
├── services/
│   ├── user-service/     # User management service
│   │   ├── config/       # MongoDB configuration
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # User routes
│   │   └── services/     # Business logic
│   └── cache-service/    # Cache management service
│       ├── config/       # Redis configuration
│       ├── routes/       # Cache routes
│       └── services/     # Cache operations
├── shared/               # Shared code
│   ├── errors/           # Error classes
│   ├── middleware/       # Shared middleware
│   ├── types/            # TypeScript types
│   └── validators/       # Validation schemas
└── dist/                 # Compiled JavaScript
```

## Features

### Microservices Architecture
- **Service Separation**: Each service handles a specific domain
- **API Gateway**: Single entry point for all client requests
- **Service Communication**: HTTP-based inter-service communication

### MongoDB Integration
- **User Storage**: Persistent user data in MongoDB
- **Mongoose ODM**: Type-safe database operations
- **Auto-generated IDs**: MongoDB ObjectId for unique identifiers

### Redis Integration
- **Distributed Caching**: Redis-backed cache for user data
- **Rate Limiting**: Redis-based rate limiting (works across instances)
- **TTL Support**: Automatic cache expiration (60 seconds)

### Rate Limiting
- **Dual Window**: 10 requests/minute, 5 requests per 10 seconds
- **Redis-backed**: Distributed rate limiting across service instances
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Testing

### Run Tests

```bash
npm test
```

### Test Coverage

Tests are written with **Mocha** and **Chai**:

- Unit tests for services
- Integration tests for routes
- Middleware tests

## Development

### Scripts

- `npm run build` - Compile TypeScript
- `npm run dev:user-service` - Start user service in dev mode
- `npm run dev:cache-service` - Start cache service in dev mode
- `npm run dev:gateway` - Start API gateway in dev mode
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/user-data-api

# Redis
REDIS_URL=redis://localhost:6379

# Service Ports
GATEWAY_PORT=3000
USER_SERVICE_PORT=3001
CACHE_SERVICE_PORT=3002

# Service URLs (for API Gateway)
USER_SERVICE_URL=http://localhost:3001
CACHE_SERVICE_URL=http://localhost:3002

# Environment
NODE_ENV=development
```

## Design Decisions

**Microservices**: Separated concerns into independent services for scalability and maintainability.

**MongoDB**: Chose MongoDB for flexible schema and easy horizontal scaling.

**Redis**: Used Redis for distributed caching and rate limiting to support multiple service instances.

**Mocha/Chai**: Industry-standard testing framework for Node.js applications.

## Limitations

- Service discovery is hardcoded (use service mesh in production)
- No authentication/authorization
- No message queue for async processing
- Health checks are basic

For production, consider adding:
- Service discovery (Consul, Eureka)
- API authentication (JWT, OAuth)
- Message queue (RabbitMQ, Kafka)
- Monitoring (Prometheus, Grafana)
- Load balancing
