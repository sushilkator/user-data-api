# User Data API

Express.js API with TypeScript for serving user data. Implements LRU caching, rate limiting, and async processing.

## Quick Start

```bash
npm install
npm run build
npm start
```

Server runs on `http://localhost:3000`

## What's Included

- **LRU Cache**: 60-second TTL, auto cleanup every 10 seconds
- **Rate Limiting**: 10 req/min, burst of 5 per 10 seconds
- **Async Queue**: Non-blocking DB simulation (200ms delay)
- **Request Deduplication**: Concurrent requests for same user share one DB call
- **Error Handling**: Custom error classes with proper status codes

## API Endpoints

### GET /users/:id
Get user by ID. Cached for 60 seconds.

```bash
curl http://localhost:3000/users/1
```

### POST /users
Create a new user. Auto-cached.

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com"}'
```

### GET /cache-status
Cache stats (hits, misses, size, avg response time).

```bash
curl http://localhost:3000/cache-status
```

### DELETE /cache
Clear the cache.

```bash
curl -X DELETE http://localhost:3000/cache
```

### GET /health
Health check.

```bash
curl http://localhost:3000/health
```

## Testing

### Automated Tests

```bash
npm test
npm run test:coverage
```

Tests cover cache, queue, rate limiter, controllers, and routes. 100% coverage.

### Manual Testing

**Postman**: Import `postman_collection.json` and `postman_environment.json`

**cURL Examples**:

```bash
# Test cache hit/miss
curl http://localhost:3000/users/1  # First: ~200ms (cache miss)
curl http://localhost:3000/users/1  # Second: <10ms (cache hit)

# Test rate limiting (send 11 requests quickly)
for i in {1..11}; do curl http://localhost:3000/users/1; done

# Test concurrent requests (should dedupe)
curl http://localhost:3000/users/1 &
curl http://localhost:3000/users/1 &
curl http://localhost:3000/users/1 &
wait
```

## Architecture Notes

### Why In-Memory Queue?

I used a simple in-memory queue instead of Bull/Redis because for a single-node demo it keeps setup simple. In production, I'd use Redis + BullMQ for distributed processing.

### Cache Implementation

The LRU cache uses a Map with TTL tracking. When capacity is reached, it evicts the least recently used entry. Background cleanup runs every 10 seconds to remove expired entries.

Cache flow:
1. Check cache → hit? return immediately
2. Check if request already in-flight → wait for that
3. Queue DB fetch → process async → cache result → return

### Rate Limiting

Dual-window approach: track requests per minute and per 10-second burst window. Each IP gets its own bucket. Old timestamps are cleaned up on each request.

### Error Handling

Custom `AppError` class with error codes. Centralized error handler middleware catches everything. In dev, errors include stack traces. In prod, generic messages only.

### Request Deduplication

When multiple requests come in for the same user ID simultaneously, they all wait for the first one to finish. Only one DB call happens, and all requests get the same cached result.

## Project Structure

```
src/
├── controllers/     # Request handlers
├── data/           # Mock user data
├── errors/         # Custom error classes
├── middleware/     # Rate limiter, error handler, metrics
├── routes/         # Route definitions
├── services/       # Business logic (cache, queue, user service)
└── types/          # TypeScript types
```

## Design Decisions

**MVC Pattern**: Routes → Controllers → Services. Keeps things organized.

**Singleton Services**: `userService` and `metrics` are singletons. Simple for this scope.

**Type Safety**: Strict TypeScript, no `any` types. All interfaces defined.

**No Validation Library**: Used simple regex for email validation. For production, I'd add `zod` or `joi`.

## Limitations

- In-memory only (not production-ready for multi-instance)
- No real database (mock data)
- No authentication
- Rate limiter state is in-memory (won't work across instances)

For production, I'd add Redis for cache/rate limiting, a real DB, and proper auth.

## Scripts

- `npm run dev` - Development with hot-reload
- `npm run build` - Compile TypeScript
- `npm start` - Production server
- `npm test` - Run tests
- `npm run test:coverage` - Coverage report
