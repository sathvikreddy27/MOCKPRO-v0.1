import { Router } from 'express';
import {
  getPosts,
  getPostById,
  getPostByUuid,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getPublishedPosts,
} from '../controllers/postController.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import {
  createPostSchema,
  updatePostSchema,
  idParamSchema,
  uuidParamSchema,
  paginationSchema,
} from '../utils/validation.js';

const router = Router();

// GET /api/posts - Get all posts with pagination and filtering
router.get('/', validateQuery(paginationSchema), getPosts);

// GET /api/posts/published - Get only published posts (public endpoint)
router.get('/published', validateQuery(paginationSchema), getPublishedPosts);

// GET /api/posts/:id - Get post by ID
router.get('/:id', validateParams(idParamSchema), getPostById);

// GET /api/posts/uuid/:uuid - Get post by UUID
router.get('/uuid/:uuid', validateParams(uuidParamSchema), getPostByUuid);

// GET /api/posts/slug/:slug - Get post by slug
router.get('/slug/:slug', getPostBySlug);

// POST /api/posts - Create new post
router.post('/', validateBody(createPostSchema), createPost);

// PUT /api/posts/:id - Update post
router.put('/:id', validateParams(idParamSchema), validateBody(updatePostSchema), updatePost);

// DELETE /api/posts/:id - Delete post
router.delete('/:id', validateParams(idParamSchema), deletePost);

export default router;