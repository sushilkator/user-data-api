import express, { Request, Response } from 'express';
import { serviceClient } from '../services/serviceClient';
import { CacheService } from '../services/cacheService';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCode } from '../../shared/types/errors';
import { CreateUserRequest } from '../../shared/types/user';

const router = express.Router();
const cacheService = new CacheService();

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;

    if (!id) {
      throw AppError.badRequest('Invalid user id.', ErrorCode.INVALID_USER_ID);
    }

    const cached = await cacheService.get(id);
    if (cached) {
      res.status(200).json({ success: true, data: cached });
      return;
    }

    const result = await serviceClient.getUserById(id);
    const response = result as { success: boolean; data?: { id: number; name: string; email: string } };

    if (response.success && response.data) {
      await cacheService.set(id, response.data);
      res.status(200).json(response);
    } else {
      throw AppError.notFound(`User with id ${id} not found.`, ErrorCode.USER_NOT_FOUND);
    }
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request<unknown, unknown, CreateUserRequest>, res: Response): Promise<void> => {
    const { name, email } = req.body;

    if (!name || !email) {
      throw AppError.badRequest('Both name and email are required.', ErrorCode.VALIDATION_ERROR);
    }

    const result = await serviceClient.createUser({ name, email });
    const response = result as { success: boolean; data?: { id: number; name: string; email: string } };

    if (response.success && response.data) {
      await cacheService.set(String(response.data.id), response.data);
      res.status(201).json(response);
    } else {
      throw AppError.internal('Failed to create user');
    }
  })
);

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await serviceClient.getAllUsers();
    res.status(200).json(result);
  })
);

export default router;

