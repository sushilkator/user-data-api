import express, { Request, Response } from 'express';
import { serviceClient } from '../services/serviceClient';
import { metrics } from '../middleware/metrics';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

const router = express.Router();

router.delete(
  '/',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await serviceClient.clearCache();
    res.status(200).json(result);
  })
);

router.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const cacheStats = await serviceClient.getCacheStatus();
    const avgResponseTimeMs = metrics.getAverageResponseTimeMs();

    const response = cacheStats as { success: boolean; data?: unknown };
    res.status(200).json({
      success: true,
      data: {
        ...(response.data as object),
        averageResponseTimeMs: avgResponseTimeMs,
      },
    });
  })
);

export default router;

