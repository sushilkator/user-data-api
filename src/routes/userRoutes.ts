import { Router } from 'express';
import {
  getUserById,
  createUser,
  clearCache,
  getCacheStatus,
} from '../controllers/userController';

const router = Router();

router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.get('/cache-status', getCacheStatus);
router.delete('/cache', clearCache);

export default router;
