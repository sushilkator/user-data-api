import express, { Request, Response } from 'express';
import { CacheService } from '../services/cacheService';
import { asyncHandler } from '../../../shared/middleware/asyncHandler';

const router = express.Router();
const cacheService = new CacheService();

router.get(
  '/:key',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { key } = req.params;
    const cached = await cacheService.get(key);
    
    if (cached) {
      res.status(200).json({ success: true, data: cached });
    } else {
      res.status(404).json({ success: false, message: 'Cache key not found' });
    }
  })
);

router.post(
  '/:key',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { key } = req.params;
    const value = req.body;
    await cacheService.set(key, value);
    res.status(200).json({ success: true, message: 'Cache set successfully' });
  })
);

router.delete(
  '/:key',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { key } = req.params;
    await cacheService.delete(key);
    res.status(200).json({ success: true, message: 'Cache key deleted' });
  })
);

router.delete(
  '/',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    await cacheService.clear();
    res.status(200).json({ success: true, data: null, message: 'Cache cleared.' });
  })
);

router.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await cacheService.getStats();
    res.status(200).json({
      success: true,
      data: {
        ...stats,
        averageResponseTimeMs: 0,
      },
    });
  })
);

export default router;

