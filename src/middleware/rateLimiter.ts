import { Request, Response, NextFunction } from 'express';
import { RateLimitRecord } from '../types/rateLimiter';
import { ErrorCode } from '../types/errors';
import { HttpStatus } from '../types/api';

// In-memory rate limit tracking per IP
const requestsByIp = new Map<string, RateLimitRecord>();

const MAX_PER_MINUTE = 10;
const MAX_PER_10_SECONDS = 5;

export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  let record = requestsByIp.get(ip);
  if (!record) {
    record = { timestamps: [] };
    requestsByIp.set(ip, record);
  }

  // Clean up old timestamps (keep last 60s)
  record.timestamps = record.timestamps.filter((t) => now - t <= 60_000);

  const lastMinuteCount = record.timestamps.length;
  const last10SecCount = record.timestamps.filter(
    (t) => now - t <= 10_000
  ).length;

  // Check both limits
  if (lastMinuteCount >= MAX_PER_MINUTE || last10SecCount >= MAX_PER_10_SECONDS) {
    const resetTime = record.timestamps.length > 0 
      ? record.timestamps[0] + 60_000 
      : now + 60_000;
    
    res.setHeader('X-RateLimit-Limit', String(MAX_PER_MINUTE));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
    
    res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      success: false,
      error: ErrorCode.RATE_LIMIT_EXCEEDED,
      errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
      message:
        'Rate limit exceeded. Please slow down (10 requests/minute, burst of 5 per 10 seconds allowed).',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  record.timestamps.push(now);
  
  const remaining = MAX_PER_MINUTE - lastMinuteCount;
  const resetTime = record.timestamps.length > 0 
    ? record.timestamps[0] + 60_000 
    : now + 60_000;
  
  res.setHeader('X-RateLimit-Limit', String(MAX_PER_MINUTE));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
  
  next();
}
