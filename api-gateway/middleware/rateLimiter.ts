import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { ErrorCode } from '../../shared/types/errors';
import { HttpStatus } from '../../shared/types/api';

const MAX_PER_MINUTE = 10;
const MAX_PER_10_SECONDS = 5;

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const nowSeconds = Math.floor(now / 1000);

  try {
    const minuteKey = `rate_limit:${ip}:minute`;
    const burstKey = `rate_limit:${ip}:burst`;

    const [minuteCount, burstCount] = await Promise.all([
      redisClient.incr(minuteKey),
      redisClient.incr(burstKey),
    ]);

    if (minuteCount === 1) {
      await redisClient.expire(minuteKey, 60);
    }
    if (burstCount === 1) {
      await redisClient.expire(burstKey, 10);
    }

    const resetTime = nowSeconds + 60;

    if (minuteCount > MAX_PER_MINUTE || burstCount > MAX_PER_10_SECONDS) {
      res.setHeader('X-RateLimit-Limit', String(MAX_PER_MINUTE));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(resetTime));

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

    const remaining = Math.max(0, MAX_PER_MINUTE - minuteCount);
    res.setHeader('X-RateLimit-Limit', String(MAX_PER_MINUTE));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetTime));

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next();
  }
}

