import { Router } from 'express';
import {
  getUsers,
  getUserById,
  getUserByUuid,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from '../controllers/userController.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import {
  createUserSchema,
  updateUserSchema,
  idParamSchema,
  uuidParamSchema,
  paginationSchema,
} from '../utils/validation.js';

const router = Router();

// GET /api/users - Get all users with pagination and filtering
router.get('/', validateQuery(paginationSchema), getUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', validateParams(idParamSchema), getUserById);

// GET /api/users/uuid/:uuid - Get user by UUID
router.get('/uuid/:uuid', validateParams(uuidParamSchema), getUserByUuid);

// POST /api/users - Create new user
router.post('/', validateBody(createUserSchema), createUser);

// PUT /api/users/:id - Update user
router.put('/:id', validateParams(idParamSchema), validateBody(updateUserSchema), updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', validateParams(idParamSchema), deleteUser);

// PATCH /api/users/:id/toggle-status - Toggle user active status
router.patch('/:id/toggle-status', validateParams(idParamSchema), toggleUserStatus);

export default router;