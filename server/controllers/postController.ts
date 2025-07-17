import { Request, Response } from 'express';
import { eq, ilike, and, desc, asc, or, ne } from 'drizzle-orm';
import db from '../config/database.js';
import { posts, users, categories, type Post, type NewPost } from '../../shared/schema.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { ValidatedRequest } from '../middleware/validation.js';

// Get all posts with pagination, filtering, and relations
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    status, 
    categoryId, 
    authorId,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  let query = db.select({
    id: posts.id,
    uuid: posts.uuid,
    title: posts.title,
    content: posts.content,
    excerpt: posts.excerpt,
    slug: posts.slug,
    status: posts.status,
    viewCount: posts.viewCount,
    publishedAt: posts.publishedAt,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    author: {
      id: users.id,
      uuid: users.uuid,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    },
    category: {
      id: categories.id,
      uuid: categories.uuid,
      name: categories.name,
      slug: categories.slug,
    },
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .leftJoin(categories, eq(posts.categoryId, categories.id));
  
  // Add filters
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        ilike(posts.title, `%${search}%`),
        ilike(posts.content, `%${search}%`)
      )
    );
  }
  
  if (status) {
    conditions.push(eq(posts.status, status));
  }
  
  if (categoryId) {
    conditions.push(eq(posts.categoryId, parseInt(categoryId)));
  }
  
  if (authorId) {
    conditions.push(eq(posts.authorId, parseInt(authorId)));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  // Add sorting
  const sortColumn = posts[sortBy as keyof typeof posts] || posts.createdAt;
  const orderFunction = sortOrder === 'asc' ? asc : desc;
  query = query.orderBy(orderFunction(sortColumn));
  
  // Add pagination
  query = query.limit(limit).offset(offset);
  
  const result = await query;
  
  // Get total count for pagination
  let totalQuery = db.select({ count: posts.id }).from(posts);
  if (conditions.length > 0) {
    totalQuery = totalQuery.where(and(...conditions));
  }
  const totalResult = await totalQuery;
  const total = totalResult.length;
  
  res.json({
    success: true,
    data: result,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get post by ID with relations
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const post = await db.select({
    id: posts.id,
    uuid: posts.uuid,
    title: posts.title,
    content: posts.content,
    excerpt: posts.excerpt,
    slug: posts.slug,
    status: posts.status,
    viewCount: posts.viewCount,
    publishedAt: posts.publishedAt,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    author: {
      id: users.id,
      uuid: users.uuid,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    },
    category: {
      id: categories.id,
      uuid: categories.uuid,
      name: categories.name,
      slug: categories.slug,
    },
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .leftJoin(categories, eq(posts.categoryId, categories.id))
  .where(eq(posts.id, parseInt(id)))
  .limit(1);
  
  if (!post.length) {
    throw new AppError('Post not found', 404);
  }
  
  // Increment view count
  await db.update(posts)
    .set({ viewCount: post[0].viewCount + 1 })
    .where(eq(posts.id, parseInt(id)));
  
  res.json({
    success: true,
    data: { ...post[0], viewCount: post[0].viewCount + 1 },
  });
});

// Get post by UUID
export const getPostByUuid = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;
  
  const post = await db.select({
    id: posts.id,
    uuid: posts.uuid,
    title: posts.title,
    content: posts.content,
    excerpt: posts.excerpt,
    slug: posts.slug,
    status: posts.status,
    viewCount: posts.viewCount,
    publishedAt: posts.publishedAt,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    author: {
      id: users.id,
      uuid: users.uuid,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    },
    category: {
      id: categories.id,
      uuid: categories.uuid,
      name: categories.name,
      slug: categories.slug,
    },
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .leftJoin(categories, eq(posts.categoryId, categories.id))
  .where(eq(posts.uuid, uuid))
  .limit(1);
  
  if (!post.length) {
    throw new AppError('Post not found', 404);
  }
  
  res.json({
    success: true,
    data: post[0],
  });
});

// Get post by slug
export const getPostBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  const post = await db.select({
    id: posts.id,
    uuid: posts.uuid,
    title: posts.title,
    content: posts.content,
    excerpt: posts.excerpt,
    slug: posts.slug,
    status: posts.status,
    viewCount: posts.viewCount,
    publishedAt: posts.publishedAt,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    author: {
      id: users.id,
      uuid: users.uuid,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    },
    category: {
      id: categories.id,
      uuid: categories.uuid,
      name: categories.name,
      slug: categories.slug,
    },
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .leftJoin(categories, eq(posts.categoryId, categories.id))
  .where(eq(posts.slug, slug))
  .limit(1);
  
  if (!post.length) {
    throw new AppError('Post not found', 404);
  }
  
  // Increment view count
  await db.update(posts)
    .set({ viewCount: post[0].viewCount + 1 })
    .where(eq(posts.id, post[0].id));
  
  res.json({
    success: true,
    data: { ...post[0], viewCount: post[0].viewCount + 1 },
  });
});

// Create new post
export const createPost = asyncHandler(async (req: ValidatedRequest<NewPost>, res: Response) => {
  const postData = req.validatedData;
  
  // TODO: Get authorId from authenticated user session
  // For now, we'll use the authorId from request body or default to 1
  const authorId = postData.authorId || 1;
  
  // Check if slug already exists
  const existingSlug = await db.select().from(posts)
    .where(eq(posts.slug, postData.slug))
    .limit(1);
  
  if (existingSlug.length) {
    throw new AppError('Post with this slug already exists', 409);
  }
  
  // Verify author exists
  const author = await db.select().from(users).where(eq(users.id, authorId)).limit(1);
  if (!author.length) {
    throw new AppError('Author not found', 404);
  }
  
  // Verify category exists if provided
  if (postData.categoryId) {
    const category = await db.select().from(categories).where(eq(categories.id, postData.categoryId)).limit(1);
    if (!category.length) {
      throw new AppError('Category not found', 404);
    }
  }
  
  // Set published date if status is published
  let publishedAt = postData.publishedAt ? new Date(postData.publishedAt) : null;
  if (postData.status === 'published' && !publishedAt) {
    publishedAt = new Date();
  }
  
  // Create post
  const newPost = await db.insert(posts).values({
    ...postData,
    authorId,
    publishedAt,
    updatedAt: new Date(),
  }).returning();
  
  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: newPost[0],
  });
});

// Update post
export const updatePost = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.validatedData;
  
  // Check if post exists
  const existingPost = await db.select().from(posts).where(eq(posts.id, parseInt(id))).limit(1);
  
  if (!existingPost.length) {
    throw new AppError('Post not found', 404);
  }
  
  // If slug is being updated, check for conflicts
  if (updateData.slug) {
    const slugConflict = await db.select().from(posts)
      .where(and(
        eq(posts.slug, updateData.slug),
        ne(posts.id, parseInt(id))
      ))
      .limit(1);
    
    if (slugConflict.length) {
      throw new AppError('Post slug already in use', 409);
    }
  }
  
  // Verify category exists if being updated
  if (updateData.categoryId) {
    const category = await db.select().from(categories).where(eq(categories.id, updateData.categoryId)).limit(1);
    if (!category.length) {
      throw new AppError('Category not found', 404);
    }
  }
  
  // Handle published date logic
  let publishedAt = updateData.publishedAt ? new Date(updateData.publishedAt) : undefined;
  if (updateData.status === 'published' && !existingPost[0].publishedAt && !publishedAt) {
    publishedAt = new Date();
  } else if (updateData.status !== 'published' && existingPost[0].status === 'published') {
    publishedAt = null;
  }
  
  // Update post
  const updatedPost = await db.update(posts)
    .set({
      ...updateData,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, parseInt(id)))
    .returning();
  
  res.json({
    success: true,
    message: 'Post updated successfully',
    data: updatedPost[0],
  });
});

// Delete post
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if post exists
  const existingPost = await db.select().from(posts).where(eq(posts.id, parseInt(id))).limit(1);
  
  if (!existingPost.length) {
    throw new AppError('Post not found', 404);
  }
  
  // TODO: Consider deleting associated comments or handling cascade deletion
  
  // Delete post
  await db.delete(posts).where(eq(posts.id, parseInt(id)));
  
  res.json({
    success: true,
    message: 'Post deleted successfully',
  });
});

// Get published posts only (for public API)
export const getPublishedPosts = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, categoryId, sortBy = 'publishedAt', sortOrder = 'desc' } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  let query = db.select({
    id: posts.id,
    uuid: posts.uuid,
    title: posts.title,
    excerpt: posts.excerpt,
    slug: posts.slug,
    viewCount: posts.viewCount,
    publishedAt: posts.publishedAt,
    author: {
      id: users.id,
      uuid: users.uuid,
      firstName: users.firstName,
      lastName: users.lastName,
    },
    category: {
      id: categories.id,
      uuid: categories.uuid,
      name: categories.name,
      slug: categories.slug,
    },
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .leftJoin(categories, eq(posts.categoryId, categories.id));
  
  // Add filters
  const conditions = [eq(posts.status, 'published')];
  
  if (search) {
    conditions.push(
      or(
        ilike(posts.title, `%${search}%`),
        ilike(posts.excerpt, `%${search}%`)
      )
    );
  }
  
  if (categoryId) {
    conditions.push(eq(posts.categoryId, parseInt(categoryId)));
  }
  
  query = query.where(and(...conditions));
  
  // Add sorting
  const sortColumn = posts[sortBy as keyof typeof posts] || posts.publishedAt;
  const orderFunction = sortOrder === 'asc' ? asc : desc;
  query = query.orderBy(orderFunction(sortColumn));
  
  // Add pagination
  query = query.limit(limit).offset(offset);
  
  const result = await query;
  
  // Get total count
  const totalResult = await db.select({ count: posts.id })
    .from(posts)
    .where(and(...conditions));
  const total = totalResult.length;
  
  res.json({
    success: true,
    data: result,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});