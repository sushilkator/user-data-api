import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from './rateLimiter';
import { connectRedis, disconnectRedis } from '../config/redis';

describe('RateLimiter', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let nextCalled: boolean;
  let statusCode: number;

  before(async () => {
    await connectRedis();
  });

  after(async () => {
    await disconnectRedis();
  });

  beforeEach(() => {
    req = { ip: '127.0.0.1' };
    nextCalled = false;
    statusCode = 0;
    res = {
      status: function (code: number) {
        statusCode = code;
        return this as Response;
      },
      json: function () {
        return this as Response;
      },
      setHeader: function () {
        return this as Response;
      },
    };
    next = () => {
      nextCalled = true;
    };
  });

  it('should allow request within rate limit', async () => {
    await rateLimiter(req as Request, res as Response, next);
    expect(nextCalled).to.be.true;
    expect(statusCode).to.equal(0);
  });

  it('should block request exceeding minute limit', async () => {
    for (let i = 0; i < 10; i++) {
      await rateLimiter(req as Request, res as Response, next);
    }

    await rateLimiter(req as Request, res as Response, next);
    expect(nextCalled).to.be.false;
    expect(statusCode).to.equal(429);
  });
});

