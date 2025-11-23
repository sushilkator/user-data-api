import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { metrics } from '../middleware/metrics';
import { CreateUserRequest } from '../types/api';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../types/errors';
import { asyncHandler } from '../middleware/errorHandler';
import { createUserSchema } from '../validators/userValidator';

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (Number.isNaN(id) || id <= 0) {
    throw AppError.badRequest('Invalid user id.', ErrorCode.INVALID_USER_ID);
  }

  const user = await userService.getUserById(id);
  
  if (!user) {
    throw AppError.notFound(`User with id ${id} not found.`, ErrorCode.USER_NOT_FOUND);
  }

  res.status(200).json({ success: true, data: user });
});

export const createUser = asyncHandler(
  async (req: Request<unknown, unknown, CreateUserRequest>, res: Response): Promise<void> => {
    const { error, value } = createUserSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      throw AppError.validation(errorMessage, error.details);
    }

    const { name, email } = value;
    const user = userService.createUser(name, email);
    res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  }
);

export const clearCache = (_req: Request, res: Response): void => {
  userService.clearCache();
  res.status(200).json({ success: true, data: null, message: 'Cache cleared.' });
};

export const getCacheStatus = (_req: Request, res: Response): void => {
  const cacheStats = userService.getCacheStats();
  const avgResponseTimeMs = metrics.getAverageResponseTimeMs();

  res.status(200).json({
    success: true,
    data: {
      ...cacheStats,
      averageResponseTimeMs: avgResponseTimeMs,
    },
  });
};

