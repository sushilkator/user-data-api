import { Request, Response, NextFunction } from 'express';

// Simple metrics tracking for response times
export class Metrics {
  private totalResponseTimeMs = 0;
  private requestCount = 0;

  record(durationMs: number): void {
    this.totalResponseTimeMs += durationMs;
    this.requestCount++;
  }

  getAverageResponseTimeMs(): number {
    if (this.requestCount === 0) return 0;
    return this.totalResponseTimeMs / this.requestCount;
  }

  // For testing purposes
  reset(): void {
    this.totalResponseTimeMs = 0;
    this.requestCount = 0;
  }
}

export const metrics = new Metrics();

export function metricsMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.record(duration);
  });
  next();
}
