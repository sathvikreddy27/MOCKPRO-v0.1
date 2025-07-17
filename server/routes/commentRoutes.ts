import { Router } from 'express';
import {
  getComments,
  getCommentById,
  getCommentByUuid,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentApproval,
  getPostComments,
  getApprovedComments,
} from '../controllers/commentController.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import {
  createCommentSchema,
  updateCommentSchema,
  idParamSchema,
  uuidParamSchema,
  paginationSchema,
} from '../utils/validation.js';

const router = Router();

// GET /api/comments - Get all comments with pagination and filtering
router.get('/', validateQuery(paginationSchema), getComments);

// GET /api/comments/approved - Get only approved comments (public endpoint)
router.get('/approved', validateQuery(paginationSchema), getApprovedComments);

// GET /api/comments/post/:postId - Get comments for a specific post
router.get('/post/:postId', validateParams(idParamSchema), getPostComments);

// GET /api/comments/:id - Get comment by ID
router.get('/:id', validateParams(idParamSchema), getCommentById);

// GET /api/comments/uuid/:uuid - Get comment by UUID
router.get('/uuid/:uuid', validateParams(uuidParamSchema), getCommentByUuid);

// POST /api/comments - Create new comment
router.post('/', validateBody(createCommentSchema), createComment);

// PUT /api/comments/:id - Update comment
router.put('/:id', validateParams(idParamSchema), validateBody(updateCommentSchema), updateComment);

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', validateParams(idParamSchema), deleteComment);

// PATCH /api/comments/:id/toggle-approval - Toggle comment approval status
router.patch('/:id/toggle-approval', validateParams(idParamSchema), toggleCommentApproval);

export default router;