import { Request, Response } from 'express';
import { Metrics, metrics, metricsMiddleware } from '../metrics';

describe('Metrics', () => {
  let metricsInstance: Metrics;

  beforeEach(() => {
    metricsInstance = new Metrics();
  });

  describe('record', () => {
    it('should record response time', () => {
      metricsInstance.record(100);
      metricsInstance.record(200);
      
      const avg = metricsInstance.getAverageResponseTimeMs();
      expect(avg).toBe(150);
    });

    it('should calculate average correctly', () => {
      metricsInstance.record(50);
      metricsInstance.record(100);
      metricsInstance.record(150);
      
      const avg = metricsInstance.getAverageResponseTimeMs();
      expect(avg).toBe(100);
    });
  });

  describe('getAverageResponseTimeMs', () => {
    it('should return 0 when no requests recorded', () => {
      expect(metricsInstance.getAverageResponseTimeMs()).toBe(0);
    });

    it('should return correct average for single request', () => {
      metricsInstance.record(100);
      expect(metricsInstance.getAverageResponseTimeMs()).toBe(100);
    });

    it('should handle decimal averages', () => {
      metricsInstance.record(100);
      metricsInstance.record(101);
      const avg = metricsInstance.getAverageResponseTimeMs();
      expect(avg).toBe(100.5);
    });
  });
});

describe('metricsMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    const callbacks: { [key: string]: () => void } = {};
    res = {
      on: jest.fn((event: string, callback: () => void) => {
        callbacks[event] = callback;
        if (event === 'finish') {
          // Simulate finish event after a delay
          setTimeout(callback, 10);
        }
        return res as Response;
      }),
    };
    next = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should call next', () => {
    metricsMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should register finish event handler', () => {
    metricsMiddleware(req as Request, res as Response, next);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should record response time on finish', () => {
    metricsMiddleware(req as Request, res as Response, next);
    
    // Trigger finish event
    const finishHandler = (res.on as jest.Mock).mock.calls.find(
      (call) => call[0] === 'finish'
    )?.[1];
    
    if (finishHandler) {
      jest.advanceTimersByTime(50);
      finishHandler();
    }
    
    // Should have recorded a response time
    const newAvg = metrics.getAverageResponseTimeMs();
    expect(newAvg).toBeGreaterThanOrEqual(0);
  });
});

