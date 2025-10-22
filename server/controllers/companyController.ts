import { Request, Response } from 'express';
import { eq, ilike, desc, asc } from 'drizzle-orm';
import db from '../config/database.js';
import { companies, type Company, type NewCompany } from '../../shared/schema.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { ValidatedRequest } from '../middleware/validation.js';

// Get all companies with pagination and filtering
export const getCompanies = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  let query = db.select().from(companies);
  
  // Add search filter
  if (search) {
    query = query.where(
      ilike(companies.name, `%${search}%`)
    );
  }
  
  // Add sorting
  const sortColumn = companies[sortBy as keyof typeof companies] || companies.name;
  const orderFunction = sortOrder === 'asc' ? asc : desc;
  query = query.orderBy(orderFunction(sortColumn));
  
  // Add pagination
  query = query.limit(limit).offset(offset);
  
  const result = await query;
  
  // Get total count for pagination
  const totalQuery = db.select({ count: companies.id }).from(companies);
  if (search) {
    totalQuery.where(ilike(companies.name, `%${search}%`));
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

// Get active companies
export const getActiveCompanies = asyncHandler(async (req: Request, res: Response) => {
  const result = await db.select()
    .from(companies)
    .where(eq(companies.isActive, true))
    .orderBy(asc(companies.name));
  
  res.json({
    success: true,
    data: result,
  });
});

// Get company by ID
export const getCompanyById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const company = await db.select().from(companies).where(eq(companies.id, parseInt(id))).limit(1);
  
  if (!company.length) {
    throw new AppError('Company not found', 404);
  }
  
  res.json({
    success: true,
    data: company[0],
  });
});

// Create new company
export const createCompany = asyncHandler(async (req: ValidatedRequest<NewCompany>, res: Response) => {
  const companyData = req.validatedData;
  
  // Check if company already exists
  const existingCompany = await db.select().from(companies).where(eq(companies.name, companyData.name)).limit(1);
  
  if (existingCompany.length) {
    throw new AppError('Company with this name already exists', 409);
  }
  
  // Create company
  const newCompany = await db.insert(companies).values({
    ...companyData,
    updatedAt: new Date(),
  }).returning();
  
  res.status(201).json({
    success: true,
    message: 'Company created successfully',
    data: newCompany[0],
  });
});

// Update company
export const updateCompany = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.validatedData;
  
  // Check if company exists
  const existingCompany = await db.select().from(companies).where(eq(companies.id, parseInt(id))).limit(1);
  
  if (!existingCompany.length) {
    throw new AppError('Company not found', 404);
  }
  
  // Update company
  const updatedCompany = await db.update(companies)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, parseInt(id)))
    .returning();
  
  res.json({
    success: true,
    message: 'Company updated successfully',
    data: updatedCompany[0],
  });
});

// Delete company
export const deleteCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if company exists
  const existingCompany = await db.select().from(companies).where(eq(companies.id, parseInt(id))).limit(1);
  
  if (!existingCompany.length) {
    throw new AppError('Company not found', 404);
  }
  
  // Delete company
  await db.delete(companies).where(eq(companies.id, parseInt(id)));
  
  res.json({
    success: true,
    message: 'Company deleted successfully',
  });
});

// Toggle company status
export const toggleCompanyStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if company exists
  const existingCompany = await db.select().from(companies).where(eq(companies.id, parseInt(id))).limit(1);
  
  if (!existingCompany.length) {
    throw new AppError('Company not found', 404);
  }
  
  // Toggle active status
  const updatedCompany = await db.update(companies)
    .set({
      isActive: !existingCompany[0].isActive,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, parseInt(id)))
    .returning();
  
  res.json({
    success: true,
    message: `Company ${updatedCompany[0].isActive ? 'activated' : 'deactivated'} successfully`,
    data: updatedCompany[0],
  });
});