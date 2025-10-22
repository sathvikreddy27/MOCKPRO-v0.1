import { Router } from 'express';
import {
  getUserProgress,
  updateUserGoals,
  getPerformanceAnalytics,
  getSkillAnalysis,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateGoalsSchema = z.object({
  weeklyGoal: z.number().min(1).max(50).optional(),
  monthlyGoal: z.number().min(1).max(200).optional(),
});

// All routes are protected
router.use(protect);

router.get('/progress', getUserProgress);
router.put('/goals', validate(updateGoalsSchema), updateUserGoals);
router.get('/performance', getPerformanceAnalytics);
router.get('/skills', getSkillAnalysis);

export default router;