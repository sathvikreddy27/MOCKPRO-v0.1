import { Request, Response } from 'express';
import { eq, and, desc, asc, isNull, isNotNull } from 'drizzle-orm';
import db from '../config/database.js';
import { comments, users, posts, type Comment, type NewComment } from '../../shared/schema.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { ValidatedRequest } from '../middleware/validation.js';

// Get all comments with pagination and filtering
export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    postId, 
    authorId, 
    isApproved,
    parentId,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  let query = db.select({
    id: comments.id,
    uuid: comments.uuid,
    content: comments.content,
    isApproved: comments.isApproved,
    parentId: comments.parentId,
    createdAt: comments.createdAt,
    updatedAt: comments.updatedAt,
    author: {
      id: users.id,
      uuid: users.uuid,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    },
    post: {
      id: posts.id,
      uuid: posts.uuid,
      title: posts.title,
      slug: posts.slug,
    },
  })
  .from(comments)
  .leftJoin(users, eq(comments.authorId, users.id))
  .leftJoin(posts, eq(comments.postId, posts.id));
  
  // Add filters
  const conditions = [];
  
  if (postId) {
    conditions.push(eq(comments.postId, parseInt(postId)));
  }
  
  if (authorId) {
    conditions.push(eq(comments.authorId, parseInt(authorId)));
  }
  
  if (isApproved !== undefined) {
    conditions.push(eq(comments.isApproved, isApproved === 'true'));
  }
  
  // Filter by parentId - if null, get top-level comments, if specified, get replies
  if (parentId === 'null' || parentId === null) {
    conditions.push(isNull(comments.parentId));
  } else if (parentId) {
    conditions.push(eq(comments.parentId, parseInt(parentId)));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  // Add sorting
  const sortColumn = comments[sortBy as keyof typeof comments] || comments.createdAt;
  const orderFunction = sortOrder === 'asc' ? asc : desc;
  query = query.orderBy(orderFunction(sortColumn));
  
  // Add pagination
  query = query.limit(limit).offset(offset);
  
  const result = await query;
  
  // Get total count for pagination
  let totalQuery = db.select({ count: comments.id }).from(comments);
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

// Get comment by ID with relations
export const getCommentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const comment = await db.select({
    id: comments.id,
    uuid: comments.uuid,
    content: comments.content,
    isApproved: comments.isApproved,
    parentId: comments.parentId,
    createdAt: comments.createdAt,
    updatedAt: comments.updatedAt,
    author: {
      id: users.id,
      uuid: users.uuid,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    },
    post: {
      id: posts.id,
      uuid: posts.uuid,
      title: posts.title,
      slug: posts.slug,
    },
  })
  .from(comments)
  .leftJoin(users, eq(comments.authorId, users.id))
  .leftJoin(posts, eq(comments.postId, posts.id))
  .where(eq(comments.id, parseInt(id)))
  .limit(1);
  
  if (!comment.length) {
    throw new AppError('Comment not found', 404);
  }
  
  res.json({
    success: true,
    data: comment[0],
  });
});

// Get comment by UUID
export const getCommentByUuid = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;
  
  const comment = await db.select({
    id: comments.id,
    uuid: comments.uuid,
    content: comments.content,
    isApproved: comments.isApproved,
    parentId: comments.parentId,
    createdAt: comments.createdAt,
    updatedAt: comments.updatedAt,
    author: {
      id: users.id,
      uuid: users.uuid,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    },
    post: {
      id: posts.id,
      uuid: posts.uuid,
      title: posts.title,
      slug: posts.slug,
    },
  })
  .from(comments)
  .leftJoin(users, eq(comments.authorId, users.id))
  .leftJoin(posts, eq(comments.postId, posts.id))
  .where(eq(comments.uuid, uuid))
  .limit(1);
  
  if (!comment.length) {
    throw new AppError('Comment not found', 404);
  }
  
  res.json({
    success: true,
    data: comment[0],
  });
});

// Create new comment
export const createComment = asyncHandler(async (req: ValidatedRequest<NewComment>, res: Response) => {
  const commentData = req.validatedData;
  
  // TODO: Get authorId from authenticated user session
  // For now, we'll use a default authorId or require it in the request
  const authorId = req.body.authorId || 1;
  
  // Verify post exists
  const post = await db.select().from(posts).where(eq(posts.id, commentData.postId)).limit(1);
  if (!post.length) {
    throw new AppError('Post not found', 404);
  }
  
  // Verify author exists
  const author = await db.select().from(users).where(eq(users.id, authorId)).limit(1);
  if (!author.length) {
    throw new AppError('Author not found', 404);
  }
  
  // If this is a reply, verify parent comment exists and belongs to the same post
  if (commentData.parentId) {
    const parentComment = await db.select().from(comments)
      .where(eq(comments.id, commentData.parentId))
      .limit(1);
    
    if (!parentComment.length) {
      throw new AppError('Parent comment not found', 404);
    }
    
    if (parentComment[0].postId !== commentData.postId) {
      throw new AppError('Parent comment must belong to the same post', 400);
    }
  }
  
  // Create comment
  const newComment = await db.insert(comments).values({
    ...commentData,
    authorId,
    updatedAt: new Date(),
  }).returning();
  
  res.status(201).json({
    success: true,
    message: 'Comment created successfully',
    data: newComment[0],
  });
});

// Update comment
export const updateComment = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.validatedData;
  
  // Check if comment exists
  const existingComment = await db.select().from(comments).where(eq(comments.id, parseInt(id))).limit(1);
  
  if (!existingComment.length) {
    throw new AppError('Comment not found', 404);
  }
  
  // TODO: Add authorization check - only author or admin can update
  
  // Update comment
  const updatedComment = await db.update(comments)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, parseInt(id)))
    .returning();
  
  res.json({
    success: true,
    message: 'Comment updated successfully',
    data: updatedComment[0],
  });
});

// Delete comment
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if comment exists
  const existingComment = await db.select().from(comments).where(eq(comments.id, parseInt(id))).limit(1);
  
  if (!existingComment.length) {
    throw new AppError('Comment not found', 404);
  }
  
  // TODO: Add authorization check - only author or admin can delete
  // TODO: Handle nested comments - either delete replies or set them as orphaned
  
  // Delete comment
  await db.delete(comments).where(eq(comments.id, parseInt(id)));
  
  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

// Approve/disapprove comment
export const toggleCommentApproval = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if comment exists
  const existingComment = await db.select().from(comments).where(eq(comments.id, parseInt(id))).limit(1);
  
  if (!existingComment.length) {
    throw new AppError('Comment not found', 404);
  }
  
  // Toggle approval status
  const updatedComment = await db.update(comments)
    .set({
      isApproved: !existingComment[0].isApproved,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, parseInt(id)))
    .returning();
  
  res.json({
    success: true,
    message: `Comment ${updatedComment[0].isApproved ? 'approved' : 'disapproved'} successfully`,
    data: updatedComment[0],
  });
});

// Get comments for a specific post with nested replies
export const getPostComments = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { includeReplies = 'true', onlyApproved = 'true' } = req.query as any;
  
  // Verify post exists
  const post = await db.select().from(posts).where(eq(posts.id, parseInt(postId))).limit(1);
  if (!post.length) {
    throw new AppError('Post not found', 404);
  }
  
  // Get top-level comments
  let conditions = [
    eq(comments.postId, parseInt(postId)),
    isNull(comments.parentId)
  ];
  
  if (onlyApproved === 'true') {
    conditions.push(eq(comments.isApproved, true));
  }
  
  const topLevelComments = await db.select({
    id: comments.id,
    uuid: comments.uuid,
    content: comments.content,
    isApproved: comments.isApproved,
    parentId: comments.parentId,
    createdAt: comments.createdAt,
    updatedAt: comments.updatedAt,
    author: {
      id: users.id,
      uuid: users.uuid,
      firstName: users.firstName,
      lastName: users.lastName,
    },
  })
  .from(comments)
  .leftJoin(users, eq(comments.authorId, users.id))
  .where(and(...conditions))
  .orderBy(asc(comments.createdAt));
  
  let result = topLevelComments;
  
  // If replies are requested, fetch them for each top-level comment
  if (includeReplies === 'true') {
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        let replyConditions = [
          eq(comments.postId, parseInt(postId)),
          eq(comments.parentId, comment.id)
        ];
        
        if (onlyApproved === 'true') {
          replyConditions.push(eq(comments.isApproved, true));
        }
        
        const replies = await db.select({
          id: comments.id,
          uuid: comments.uuid,
          content: comments.content,
          isApproved: comments.isApproved,
          parentId: comments.parentId,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          author: {
            id: users.id,
            uuid: users.uuid,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(and(...replyConditions))
        .orderBy(asc(comments.createdAt));
        
        return {
          ...comment,
          replies,
        };
      })
    );
    
    result = commentsWithReplies;
  }
  
  res.json({
    success: true,
    data: result,
  });
});

// Get approved comments only (for public API)
export const getApprovedComments = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, postId } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  let query = db.select({
    id: comments.id,
    uuid: comments.uuid,
    content: comments.content,
    createdAt: comments.createdAt,
    author: {
      id: users.id,
      uuid: users.uuid,
      firstName: users.firstName,
      lastName: users.lastName,
    },
    post: {
      id: posts.id,
      uuid: posts.uuid,
      title: posts.title,
      slug: posts.slug,
    },
  })
  .from(comments)
  .leftJoin(users, eq(comments.authorId, users.id))
  .leftJoin(posts, eq(comments.postId, posts.id));
  
  const conditions = [eq(comments.isApproved, true)];
  
  if (postId) {
    conditions.push(eq(comments.postId, parseInt(postId)));
  }
  
  query = query.where(and(...conditions))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);
  
  const result = await query;
  
  // Get total count
  let totalQuery = db.select({ count: comments.id }).from(comments);
  totalQuery = totalQuery.where(and(...conditions));
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