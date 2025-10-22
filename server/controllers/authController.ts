import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { users, userProgress, type User, type NewUser } from '../../shared/schema.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (userId: number) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Register new user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, targetCompany, skillLevel, currentRole, experienceYears } = req.body;

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingUser.length) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const newUser = await db.insert(users).values({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    targetCompany,
    skillLevel: skillLevel || 'beginner',
    currentRole,
    experienceYears: experienceYears || 0,
    authProvider: 'email',
    updatedAt: new Date(),
  }).returning();

  // Create initial user progress record
  await db.insert(userProgress).values({
    userId: newUser[0].id,
    totalInterviews: 0,
    averageScore: '0',
    bestScore: '0',
    improvementRate: '0',
    skillsImproved: [],
    weeklyGoal: 3,
    monthlyGoal: 12,
    streak: 0,
    updatedAt: new Date(),
  });

  // Generate token
  const token = generateToken(newUser[0].id);

  // Remove password from response
  const { password: _, ...safeUser } = newUser[0];

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: safeUser,
      token,
    },
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Find user
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (!user.length) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user[0].isActive) {
    throw new AppError('Account is deactivated. Please contact support.', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user[0].password || '');
  
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user[0].id);

  // Remove password from response
  const { password: _, ...safeUser } = user[0];

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: safeUser,
      token,
    },
  });
});

// Google OAuth callback (placeholder for now)
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  // This will be implemented with passport-google-oauth20
  // For now, return a placeholder response
  res.json({
    success: true,
    message: 'Google authentication endpoint - to be implemented',
  });
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
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

// Update user profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { firstName, lastName, targetCompany, skillLevel, currentRole, experienceYears, profilePicture } = req.body;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Update user
  const updatedUser = await db.update(users)
    .set({
      firstName,
      lastName,
      targetCompany,
      skillLevel,
      currentRole,
      experienceYears,
      profilePicture,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser.length) {
    throw new AppError('User not found', 404);
  }

  // Remove password from response
  const { password, ...safeUser } = updatedUser[0];

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: safeUser,
  });
});

// Change password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password', 400);
  }

  // Find user
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user.length) {
    throw new AppError('User not found', 404);
  }

  // Check current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user[0].password || '');
  
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await db.update(users)
    .set({
      password: hashedNewPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// Refresh token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Generate new token
  const token = generateToken(userId);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: { token },
  });
});

// Logout (client-side token removal)
export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
});