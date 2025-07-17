import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.enum(['user', 'admin', 'moderator']).default('user'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  isActive: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100).optional(),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  isActive: z.boolean().optional(),
});

// Post validation schemas
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500).optional(),
  slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  categoryId: z.number().int().positive().optional(),
  publishedAt: z.string().datetime().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  content: z.string().min(1, 'Content is required').optional(),
  excerpt: z.string().max(500).optional(),
  slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  categoryId: z.number().int().positive().optional(),
  publishedAt: z.string().datetime().optional(),
});

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  postId: z.number().int().positive('Valid post ID is required'),
  parentId: z.number().int().positive().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').optional(),
  isApproved: z.boolean().optional(),
});

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid decimal with up to 2 decimal places'),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  sku: z.string().min(1, 'SKU is required').max(100),
  categoryId: z.number().int().positive().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255).optional(),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid decimal with up to 2 decimal places').optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  sku: z.string().min(1, 'SKU is required').max(100).optional(),
  categoryId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// Pagination and query parameters
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export const uuidParamSchema = z.object({
  uuid: z.string().uuid('Invalid UUID format'),
});

export const idParamSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive('Invalid ID')),
});