import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  getCategoryByUuid,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getActiveCategories,
} from '../controllers/categoryController.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import {
  createCategorySchema,
  updateCategorySchema,
  idParamSchema,
  uuidParamSchema,
  paginationSchema,
} from '../utils/validation.js';

const router = Router();

// GET /api/categories - Get all categories with pagination and filtering
router.get('/', validateQuery(paginationSchema), getCategories);

// GET /api/categories/active - Get only active categories (public endpoint)
router.get('/active', getActiveCategories);

// GET /api/categories/:id - Get category by ID
router.get('/:id', validateParams(idParamSchema), getCategoryById);

// GET /api/categories/uuid/:uuid - Get category by UUID
router.get('/uuid/:uuid', validateParams(uuidParamSchema), getCategoryByUuid);

// GET /api/categories/slug/:slug - Get category by slug
router.get('/slug/:slug', getCategoryBySlug);

// POST /api/categories - Create new category
router.post('/', validateBody(createCategorySchema), createCategory);

// PUT /api/categories/:id - Update category
router.put('/:id', validateParams(idParamSchema), validateBody(updateCategorySchema), updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', validateParams(idParamSchema), deleteCategory);

// PATCH /api/categories/:id/toggle-status - Toggle category active status
router.patch('/:id/toggle-status', validateParams(idParamSchema), toggleCategoryStatus);

export default router;