import express, { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { CreateUserRequest } from '../../../shared/types/user';
import { AppError } from '../../../shared/errors/AppError';
import { ErrorCode } from '../../../shared/types/errors';
import { asyncHandler } from '../../../shared/middleware/asyncHandler';

const router = express.Router();
const userService = new UserService();

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    
    if (!id) {
      throw AppError.badRequest('Invalid user id.', ErrorCode.INVALID_USER_ID);
    }

    const user = await userService.getUserById(id);
    
    if (!user) {
      throw AppError.notFound(`User with id ${id} not found.`, ErrorCode.USER_NOT_FOUND);
    }

    res.status(200).json({ success: true, data: user });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request<unknown, unknown, CreateUserRequest>, res: Response): Promise<void> => {
    const { name, email } = req.body;

    if (!name || !email) {
      throw AppError.badRequest('Both name and email are required.', ErrorCode.VALIDATION_ERROR);
    }

    const user = await userService.createUser({ name, email });
    res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  })
);

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  })
);

export default router;

