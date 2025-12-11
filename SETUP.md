# Setup Guide

## Quick Setup with Docker

1. **Start MongoDB and Redis:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start services:**
   ```bash
   # Terminal 1
   npm run dev:user-service

   # Terminal 2
   npm run dev:cache-service

   # Terminal 3
   npm run dev:gateway
   ```

## Manual Setup

### MongoDB
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### Redis
```bash
# Install Redis locally or use Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

## Environment Variables

Create a `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/user-data-api
REDIS_URL=redis://localhost:6379
GATEWAY_PORT=3000
USER_SERVICE_PORT=3001
CACHE_SERVICE_PORT=3002
USER_SERVICE_URL=http://localhost:3001
CACHE_SERVICE_URL=http://localhost:3002
NODE_ENV=development
```

## Verify Setup

1. **Check MongoDB:**
   ```bash
   docker exec -it user-data-mongodb mongosh
   ```

2. **Check Redis:**
   ```bash
   docker exec -it user-data-redis redis-cli ping
   # Should return: PONG
   ```

3. **Test API Gateway:**
   ```bash
   curl http://localhost:3000/health
   ```

## Running Tests

```bash
# Make sure MongoDB and Redis are running
npm test
```

