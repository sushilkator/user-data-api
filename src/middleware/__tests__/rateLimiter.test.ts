import { Request, Response } from 'express';

// Test rate limiter by importing it fresh each time
describe('rateLimiter', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
  });

  it('should allow request within rate limit', () => {
    const { rateLimiter } = require('../rateLimiter');
    const req = { ip: '127.0.0.1' } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn();

    rateLimiter(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block request exceeding minute limit', () => {
    const { rateLimiter } = require('../rateLimiter');
    const req = { ip: '127.0.0.1' } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn();

    // Send 10 requests (at limit)
    for (let i = 0; i < 10; i++) {
      rateLimiter(req, res, next);
      jest.advanceTimersByTime(100);
    }

    // 11th request should be blocked
    rateLimiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Rate limit exceeded',
      })
    );
  });

  it('should block request exceeding burst limit', () => {
    const { rateLimiter } = require('../rateLimiter');
    const req = { ip: '127.0.0.1' } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn();

    // Send 5 requests rapidly (burst limit)
    for (let i = 0; i < 5; i++) {
      rateLimiter(req, res, next);
      jest.advanceTimersByTime(100);
    }

    // 6th request within 10 seconds should be blocked
    rateLimiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should reset burst window after 10 seconds', () => {
    const { rateLimiter } = require('../rateLimiter');
    const req = { ip: '127.0.0.1' } as Request;
    const res1 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next1 = jest.fn();

    // Send 5 requests (burst limit)
    for (let i = 0; i < 5; i++) {
      rateLimiter(req, res1, next1);
      jest.advanceTimersByTime(100);
    }

    // Advance time past 10 seconds
    jest.advanceTimersByTime(10000);

    // Should allow new request
    const res2 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next2 = jest.fn();
    rateLimiter(req, res2, next2);

    expect(next2).toHaveBeenCalled();
    expect(res2.status).not.toHaveBeenCalled();
  });

  it('should reset minute window after 60 seconds', () => {
    const { rateLimiter } = require('../rateLimiter');
    const req = { ip: '127.0.0.1' } as Request;
    const res1 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next1 = jest.fn();

    // Send 10 requests (minute limit)
    for (let i = 0; i < 10; i++) {
      rateLimiter(req, res1, next1);
      jest.advanceTimersByTime(1000);
    }

    // Advance time past 60 seconds
    jest.advanceTimersByTime(60000);

    // Should allow new request
    const res2 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next2 = jest.fn();
    rateLimiter(req, res2, next2);

    expect(next2).toHaveBeenCalled();
  });

  it('should handle different IP addresses separately', () => {
    const { rateLimiter } = require('../rateLimiter');
    const req1 = { ip: '127.0.0.1' } as Request;
    const req2 = { ip: '192.168.1.1' } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn();

    // Send 10 requests from IP1
    for (let i = 0; i < 10; i++) {
      rateLimiter(req1, res, next);
      jest.advanceTimersByTime(100);
    }

    // IP2 should still be able to make requests
    const next2 = jest.fn();
    rateLimiter(req2, res, next2);

    expect(next2).toHaveBeenCalled();
  });

  it('should handle missing IP address', () => {
    const { rateLimiter } = require('../rateLimiter');
    const reqNoIp = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn();

    rateLimiter(reqNoIp, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should cleanup old entries', () => {
    const { rateLimiter } = require('../rateLimiter');
    const req = { ip: '127.0.0.1' } as Request;
    const res1 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next1 = jest.fn();

    // Send some requests
    for (let i = 0; i < 5; i++) {
      rateLimiter(req, res1, next1);
      jest.advanceTimersByTime(100);
    }

    // Advance time past 60 seconds
    jest.advanceTimersByTime(61000);

    // New request should be allowed (old entries cleaned up)
    const res2 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next2 = jest.fn();
    rateLimiter(req, res2, next2);

    expect(next2).toHaveBeenCalled();
  });

  it('should return proper error message on rate limit', () => {
    const { rateLimiter } = require('../rateLimiter');
    const req = { ip: '127.0.0.1' } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn();

    // Exceed rate limit
    for (let i = 0; i < 11; i++) {
      rateLimiter(req, res, next);
      jest.advanceTimersByTime(100);
    }

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Rate limit exceeded'),
      })
    );
  });
});

