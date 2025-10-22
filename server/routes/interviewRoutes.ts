import { Router } from 'express';
import {
  getInterviewQuestions,
  getRandomQuestions,
  startInterviewSession,
  submitAnswer,
  completeInterviewSession,
  getUserInterviewSessions,
  getInterviewSessionDetails,
} from '../controllers/interviewController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const startSessionSchema = z.object({
  type: z.enum(['technical', 'hr', 'behavioral', 'mixed']),
  companyId: z.number().optional(),
  questionIds: z.array(z.number()).optional(),
});

const submitAnswerSchema = z.object({
  sessionId: z.number(),
  questionId: z.number(),
  userAnswer: z.string().optional(),
  codeSubmission: z.string().optional(),
  timeSpent: z.number().min(0),
});

const completeSessionSchema = z.object({
  sessionId: z.number(),
});

// Public routes (for browsing questions)
router.get('/questions', getInterviewQuestions);
router.get('/questions/random', getRandomQuestions);

// Protected routes
router.use(protect);

// Interview session management
router.post('/sessions/start', validate(startSessionSchema), startInterviewSession);
router.post('/sessions/submit-answer', validate(submitAnswerSchema), submitAnswer);
router.post('/sessions/complete', validate(completeSessionSchema), completeInterviewSession);
router.get('/sessions', getUserInterviewSessions);
router.get('/sessions/:sessionId', getInterviewSessionDetails);

export default router;