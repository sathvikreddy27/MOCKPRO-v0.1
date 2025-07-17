import { Request, Response } from 'express';
import { eq, ilike, and, desc, asc, ne } from 'drizzle-orm';
import db from '../config/database.js';
import { categories, type Category, type NewCategory } from '../../shared/schema.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { ValidatedRequest } from '../middleware/validation.js';

// Get all categories with pagination and filtering
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  // Build conditions array
  const conditions = [];
  if (search) {
    conditions.push(ilike(categories.name, `%${search}%`));
  }
  
  // Build the complete query
  const sortColumn = sortBy === 'name' ? categories.name : 
                    sortBy === 'slug' ? categories.slug :
                    categories.createdAt;
  const orderFunction = sortOrder === 'asc' ? asc : desc;
  
  const query = db.select().from(categories)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderFunction(sortColumn))
    .limit(limit)
    .offset(offset);
  
  const result = await query;
  
  // Get total count for pagination
  const totalResult = await db.select({ count: categories.id }).from(categories)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
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

// Get category by ID
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const category = await db.select().from(categories).where(eq(categories.id, parseInt(id))).limit(1);
  
  if (!category.length) {
    throw new AppError('Category not found', 404);
  }
  
  res.json({
    success: true,
    data: category[0],
  });
});

// Get category by UUID
export const getCategoryByUuid = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;
  
  const category = await db.select().from(categories).where(eq(categories.uuid, uuid)).limit(1);
  
  if (!category.length) {
    throw new AppError('Category not found', 404);
  }
  
  res.json({
    success: true,
    data: category[0],
  });
});

// Get category by slug
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  const category = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  
  if (!category.length) {
    throw new AppError('Category not found', 404);
  }
  
  res.json({
    success: true,
    data: category[0],
  });
});

// Create new category
export const createCategory = asyncHandler(async (req: ValidatedRequest<NewCategory>, res: Response) => {
  const categoryData = req.validatedData;
  
  // Check if category with same name or slug already exists
  const existingCategory = await db.select().from(categories)
    .where(ilike(categories.name, categoryData.name))
    .limit(1);
  
  if (existingCategory.length) {
    throw new AppError('Category with this name already exists', 409);
  }
  
  const existingSlug = await db.select().from(categories)
    .where(eq(categories.slug, categoryData.slug))
    .limit(1);
  
  if (existingSlug.length) {
    throw new AppError('Category with this slug already exists', 409);
  }
  
  // Create category
  const newCategory = await db.insert(categories).values({
    ...categoryData,
    updatedAt: new Date(),
  }).returning();
  
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: newCategory[0],
  });
});

// Update category
export const updateCategory = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.validatedData;
  
  // Check if category exists
  const existingCategory = await db.select().from(categories).where(eq(categories.id, parseInt(id))).limit(1);
  
  if (!existingCategory.length) {
    throw new AppError('Category not found', 404);
  }
  
  // If name is being updated, check for conflicts
  if (updateData.name) {
    const nameConflict = await db.select().from(categories)
      .where(and(
        ilike(categories.name, updateData.name),
        ne(categories.id, parseInt(id))
      ))
      .limit(1);
    
    if (nameConflict.length) {
      throw new AppError('Category name already in use', 409);
    }
  }
  
  // If slug is being updated, check for conflicts
  if (updateData.slug) {
    const slugConflict = await db.select().from(categories)
      .where(and(
        eq(categories.slug, updateData.slug),
        ne(categories.id, parseInt(id))
      ))
      .limit(1);
    
    if (slugConflict.length) {
      throw new AppError('Category slug already in use', 409);
    }
  }
  
  // Update category
  const updatedCategory = await db.update(categories)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, parseInt(id)))
    .returning();
  
  res.json({
    success: true,
    message: 'Category updated successfully',
    data: updatedCategory[0],
  });
});

// Delete category
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if category exists
  const existingCategory = await db.select().from(categories).where(eq(categories.id, parseInt(id))).limit(1);
  
  if (!existingCategory.length) {
    throw new AppError('Category not found', 404);
  }
  
  // TODO: Check if category has associated posts/products before deletion
  // You might want to either prevent deletion or cascade delete based on business logic
  
  // Delete category
  await db.delete(categories).where(eq(categories.id, parseInt(id)));
  
  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
});

// Toggle category status
export const toggleCategoryStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if category exists
  const existingCategory = await db.select().from(categories).where(eq(categories.id, parseInt(id))).limit(1);
  
  if (!existingCategory.length) {
    throw new AppError('Category not found', 404);
  }
  
  // Toggle active status
  const updatedCategory = await db.update(categories)
    .set({
      isActive: !existingCategory[0].isActive,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, parseInt(id)))
    .returning();
  
  res.json({
    success: true,
    message: `Category ${updatedCategory[0].isActive ? 'activated' : 'deactivated'} successfully`,
    data: updatedCategory[0],
  });
});

// Get active categories only (for public endpoints)
export const getActiveCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await db.select().from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.name));
  
  res.json({
    success: true,
    data: result,
  });
});