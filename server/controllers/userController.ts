import { Request, Response } from 'express';
import { eq, ilike, and, desc, asc, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { users, type User, type NewUser } from '../../shared/schema.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { ValidatedRequest } from '../middleware/validation.js';

// Get all users with pagination and filtering
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  let query = db.select().from(users);
  
  // Add search filter
  if (search) {
    query = query.where(
      ilike(users.email, `%${search}%`)
    );
  }
  
  // Add sorting
  const sortColumn = users[sortBy as keyof typeof users] || users.createdAt;
  const orderFunction = sortOrder === 'asc' ? asc : desc;
  query = query.orderBy(orderFunction(sortColumn));
  
  // Add pagination
  query = query.limit(limit).offset(offset);
  
  const result = await query;
  
  // Get total count for pagination
  const totalQuery = db.select({ count: users.id }).from(users);
  if (search) {
    totalQuery.where(ilike(users.email, `%${search}%`));
  }
  const totalResult = await totalQuery;
  const total = totalResult.length;
  
  // Remove passwords from response
  const safeUsers = result.map(({ password, ...user }) => user);
  
  res.json({
    success: true,
    data: safeUsers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const user = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);
  
  if (!user.length) {
    throw new AppError('User not found', 404);
  }
  
  // Remove password from response
  const { password, ...safeUser } = user[0];
  
  res.json({
    success: true,
    data: safeUser,
  });
});

// Get user by UUID
export const getUserByUuid = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;
  
  const user = await db.select().from(users).where(eq(users.uuid, uuid)).limit(1);
  
  if (!user.length) {
    throw new AppError('User not found', 404);
  }
  
  // Remove password from response
  const { password, ...safeUser } = user[0];
  
  res.json({
    success: true,
    data: safeUser,
  });
});

// Create new user
export const createUser = asyncHandler(async (req: ValidatedRequest<NewUser>, res: Response) => {
  const userData = req.validatedData;
  
  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
  
  if (existingUser.length) {
    throw new AppError('User with this email already exists', 409);
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  // Create user
  const newUser = await db.insert(users).values({
    ...userData,
    password: hashedPassword,
    updatedAt: new Date(),
  }).returning();
  
  // Remove password from response
  const { password, ...safeUser } = newUser[0];
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: safeUser,
  });
});

// Update user
export const updateUser = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.validatedData;
  
  // Check if user exists
  const existingUser = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);
  
  if (!existingUser.length) {
    throw new AppError('User not found', 404);
  }
  
  // If email is being updated, check for conflicts
  if (updateData.email) {
    const emailConflict = await db.select().from(users)
      .where(and(eq(users.email, updateData.email), ne(users.id, parseInt(id))))
      .limit(1);
    
    if (emailConflict.length) {
      throw new AppError('Email already in use by another user', 409);
    }
  }
  
  // Update user
  const updatedUser = await db.update(users)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parseInt(id)))
    .returning();
  
  // Remove password from response
  const { password, ...safeUser } = updatedUser[0];
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: safeUser,
  });
});

// Delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if user exists
  const existingUser = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);
  
  if (!existingUser.length) {
    throw new AppError('User not found', 404);
  }
  
  // Delete user
  await db.delete(users).where(eq(users.id, parseInt(id)));
  
  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Activate/deactivate user
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if user exists
  const existingUser = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);
  
  if (!existingUser.length) {
    throw new AppError('User not found', 404);
  }
  
  // Toggle active status
  const updatedUser = await db.update(users)
    .set({
      isActive: !existingUser[0].isActive,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parseInt(id)))
    .returning();
  
  // Remove password from response
  const { password, ...safeUser } = updatedUser[0];
  
  res.json({
    success: true,
    message: `User ${safeUser.isActive ? 'activated' : 'deactivated'} successfully`,
    data: safeUser,
  });
});