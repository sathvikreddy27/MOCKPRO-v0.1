import { Router } from 'express';
import {
  getCompanies,
  getActiveCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus,
} from '../controllers/companyController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  logo: z.string().url().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').optional(),
  logo: z.string().url().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Public routes
router.get('/active', getActiveCompanies);
router.get('/', getCompanies);
router.get('/:id', getCompanyById);

// Protected routes (admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', validate(createCompanySchema), createCompany);
router.put('/:id', validate(updateCompanySchema), updateCompany);
router.delete('/:id', deleteCompany);
router.patch('/:id/toggle-status', toggleCompanyStatus);

export default router;