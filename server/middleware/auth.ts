import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import db from '../config/database.js';
import { users } from '../../shared/schema.js';
import { AppError, asyncHandler } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// Protect routes - require authentication
export const protect = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('You are not logged in! Please log in to get access.', 401);
  }

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

  // Check if user still exists
  const currentUser = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

  if (!currentUser.length) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  // Check if user is active
  if (!currentUser[0].isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 401);
  }

  // Grant access to protected route
  req.user = {
    id: currentUser[0].id,
    email: currentUser[0].email,
    firstName: currentUser[0].firstName,
    lastName: currentUser[0].lastName,
    role: currentUser[0].role,
  };

  next();
});

// Restrict to certain roles
export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  };
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

      // Check if user still exists
      const currentUser = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

      if (currentUser.length && currentUser[0].isActive) {
        req.user = {
          id: currentUser[0].id,
          email: currentUser[0].email,
          firstName: currentUser[0].firstName,
          lastName: currentUser[0].lastName,
          role: currentUser[0].role,
        };
      }
    } catch (error) {
      // Token is invalid, but we don't throw an error
      // Just continue without setting req.user
    }
  }

  next();
});