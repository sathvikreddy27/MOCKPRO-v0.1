import { Request, Response } from 'express';
import { eq, ilike, and, desc, asc, gte, lte, or, ne } from 'drizzle-orm';
import db from '../config/database.js';
import { products, categories, type Product, type NewProduct } from '../../shared/schema.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { ValidatedRequest } from '../middleware/validation.js';

// Get all products with pagination, filtering, and relations
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    categoryId, 
    minPrice,
    maxPrice,
    inStock,
    isActive,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  let query = db.select({
    id: products.id,
    uuid: products.uuid,
    name: products.name,
    description: products.description,
    price: products.price,
    stock: products.stock,
    sku: products.sku,
    isActive: products.isActive,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
    category: {
      id: categories.id,
      uuid: categories.uuid,
      name: categories.name,
      slug: categories.slug,
    },
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id));
  
  // Add filters
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`),
        ilike(products.sku, `%${search}%`)
      )
    );
  }
  
  if (categoryId) {
    conditions.push(eq(products.categoryId, parseInt(categoryId)));
  }
  
  if (minPrice) {
    conditions.push(gte(products.price, minPrice));
  }
  
  if (maxPrice) {
    conditions.push(lte(products.price, maxPrice));
  }
  
  if (inStock === 'true') {
    conditions.push(gte(products.stock, 1));
  } else if (inStock === 'false') {
    conditions.push(eq(products.stock, 0));
  }
  
  if (isActive !== undefined) {
    conditions.push(eq(products.isActive, isActive === 'true'));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  // Add sorting
  const sortColumn = products[sortBy as keyof typeof products] || products.createdAt;
  const orderFunction = sortOrder === 'asc' ? asc : desc;
  query = query.orderBy(orderFunction(sortColumn));
  
  // Add pagination
  query = query.limit(limit).offset(offset);
  
  const result = await query;
  
  // Get total count for pagination
  let totalQuery = db.select({ count: products.id }).from(products);
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

// Get product by ID with relations
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const product = await db.select({
    id: products.id,
    uuid: products.uuid,
    name: products.name,
    description: products.description,
    price: products.price,
    stock: products.stock,
    sku: products.sku,
    isActive: products.isActive,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
    category: {
      id: categories.id,
      uuid: categories.uuid,
      name: categories.name,
      slug: categories.slug,
    },
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .where(eq(products.id, parseInt(id)))
  .limit(1);
  
  if (!product.length) {
    throw new AppError('Product not found', 404);
  }
  
  res.json({
    success: true,
    data: product[0],
  });
});

// Get product by UUID
export const getProductByUuid = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;
  
  const product = await db.select({
    id: products.id,
    uuid: products.uuid,
    name: products.name,
    description: products.description,
    price: products.price,
    stock: products.stock,
    sku: products.sku,
    isActive: products.isActive,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
    category: {
      id: categories.id,
      uuid: categories.uuid,
      name: categories.name,
      slug: categories.slug,
    },
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .where(eq(products.uuid, uuid))
  .limit(1);
  
  if (!product.length) {
    throw new AppError('Product not found', 404);
  }
  
  res.json({
    success: true,
    data: product[0],
  });
});

// Get product by SKU
export const getProductBySku = asyncHandler(async (req: Request, res: Response) => {
  const { sku } = req.params;
  
  const product = await db.select({
    id: products.id,
    uuid: products.uuid,
    name: products.name,
    description: products.description,
    price: products.price,
    stock: products.stock,
    sku: products.sku,
    isActive: products.isActive,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
    category: {
      id: categories.id,
      uuid: categories.uuid,
      name: categories.name,
      slug: categories.slug,
    },
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .where(eq(products.sku, sku))
  .limit(1);
  
  if (!product.length) {
    throw new AppError('Product not found', 404);
  }
  
  res.json({
    success: true,
    data: product[0],
  });
});

// Create new product
export const createProduct = asyncHandler(async (req: ValidatedRequest<NewProduct>, res: Response) => {
  const productData = req.validatedData;
  
  // Check if product with same SKU already exists
  const existingSku = await db.select().from(products)
    .where(eq(products.sku, productData.sku))
    .limit(1);
  
  if (existingSku.length) {
    throw new AppError('Product with this SKU already exists', 409);
  }
  
  // Verify category exists if provided
  if (productData.categoryId) {
    const category = await db.select().from(categories).where(eq(categories.id, productData.categoryId)).limit(1);
    if (!category.length) {
      throw new AppError('Category not found', 404);
    }
  }
  
  // Create product
  const newProduct = await db.insert(products).values({
    ...productData,
    updatedAt: new Date(),
  }).returning();
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: newProduct[0],
  });
});

// Update product
export const updateProduct = asyncHandler(async (req: ValidatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.validatedData;
  
  // Check if product exists
  const existingProduct = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
  
  if (!existingProduct.length) {
    throw new AppError('Product not found', 404);
  }
  
  // If SKU is being updated, check for conflicts
  if (updateData.sku) {
    const skuConflict = await db.select().from(products)
      .where(and(
        eq(products.sku, updateData.sku),
        ne(products.id, parseInt(id))
      ))
      .limit(1);
    
    if (skuConflict.length) {
      throw new AppError('Product SKU already in use', 409);
    }
  }
  
  // Verify category exists if being updated
  if (updateData.categoryId) {
    const category = await db.select().from(categories).where(eq(categories.id, updateData.categoryId)).limit(1);
    if (!category.length) {
      throw new AppError('Category not found', 404);
    }
  }
  
  // Update product
  const updatedProduct = await db.update(products)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(products.id, parseInt(id)))
    .returning();
  
  res.json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct[0],
  });
});

// Delete product
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if product exists
  const existingProduct = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
  
  if (!existingProduct.length) {
    throw new AppError('Product not found', 404);
  }
  
  // TODO: Consider checking for associated orders before deletion
  
  // Delete product
  await db.delete(products).where(eq(products.id, parseInt(id)));
  
  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

// Toggle product status
export const toggleProductStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if product exists
  const existingProduct = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
  
  if (!existingProduct.length) {
    throw new AppError('Product not found', 404);
  }
  
  // Toggle active status
  const updatedProduct = await db.update(products)
    .set({
      isActive: !existingProduct[0].isActive,
      updatedAt: new Date(),
    })
    .where(eq(products.id, parseInt(id)))
    .returning();
  
  res.json({
    success: true,
    message: `Product ${updatedProduct[0].isActive ? 'activated' : 'deactivated'} successfully`,
    data: updatedProduct[0],
  });
});

// Update product stock
export const updateProductStock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stock, operation = 'set' } = req.body; // operation can be 'set', 'add', 'subtract'
  
  // Check if product exists
  const existingProduct = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
  
  if (!existingProduct.length) {
    throw new AppError('Product not found', 404);
  }
  
  let newStock = stock;
  
  if (operation === 'add') {
    newStock = existingProduct[0].stock + stock;
  } else if (operation === 'subtract') {
    newStock = existingProduct[0].stock - stock;
    if (newStock < 0) {
      throw new AppError('Stock cannot be negative', 400);
    }
  }
  
  // Update stock
  const updatedProduct = await db.update(products)
    .set({
      stock: newStock,
      updatedAt: new Date(),
    })
    .where(eq(products.id, parseInt(id)))
    .returning();
  
  res.json({
    success: true,
    message: 'Product stock updated successfully',
    data: updatedProduct[0],
  });
});

// Get active products only (for public API)
export const getActiveProducts = asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    categoryId, 
    minPrice,
    maxPrice,
    inStock = 'true',
    sortBy = 'name', 
    sortOrder = 'asc' 
  } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  let query = db.select({
    id: products.id,
    uuid: products.uuid,
    name: products.name,
    description: products.description,
    price: products.price,
    stock: products.stock,
    sku: products.sku,
    category: {
      id: categories.id,
      uuid: categories.uuid,
      name: categories.name,
      slug: categories.slug,
    },
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id));
  
  // Add filters
  const conditions = [eq(products.isActive, true)];
  
  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`)
      )
    );
  }
  
  if (categoryId) {
    conditions.push(eq(products.categoryId, parseInt(categoryId)));
  }
  
  if (minPrice) {
    conditions.push(gte(products.price, minPrice));
  }
  
  if (maxPrice) {
    conditions.push(lte(products.price, maxPrice));
  }
  
  if (inStock === 'true') {
    conditions.push(gte(products.stock, 1));
  }
  
  query = query.where(and(...conditions));
  
  // Add sorting
  const sortColumn = products[sortBy as keyof typeof products] || products.name;
  const orderFunction = sortOrder === 'asc' ? asc : desc;
  query = query.orderBy(orderFunction(sortColumn));
  
  // Add pagination
  query = query.limit(limit).offset(offset);
  
  const result = await query;
  
  // Get total count
  const totalResult = await db.select({ count: products.id })
    .from(products)
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

// Get low stock products
export const getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
  const { threshold = 10 } = req.query as any;
  
  const result = await db.select({
    id: products.id,
    uuid: products.uuid,
    name: products.name,
    stock: products.stock,
    sku: products.sku,
    category: {
      id: categories.id,
      name: categories.name,
    },
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .where(and(
    eq(products.isActive, true),
    lte(products.stock, threshold)
  ))
  .orderBy(asc(products.stock));
  
  res.json({
    success: true,
    data: result,
  });
});

// Get products by category
export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const { page = 1, limit = 10, onlyActive = 'true' } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  // Verify category exists
  const category = await db.select().from(categories).where(eq(categories.id, parseInt(categoryId))).limit(1);
  if (!category.length) {
    throw new AppError('Category not found', 404);
  }
  
  let query = db.select({
    id: products.id,
    uuid: products.uuid,
    name: products.name,
    description: products.description,
    price: products.price,
    stock: products.stock,
    sku: products.sku,
    isActive: products.isActive,
  })
  .from(products);
  
  const conditions = [eq(products.categoryId, parseInt(categoryId))];
  
  if (onlyActive === 'true') {
    conditions.push(eq(products.isActive, true));
  }
  
  query = query.where(and(...conditions))
    .orderBy(asc(products.name))
    .limit(limit)
    .offset(offset);
  
  const result = await query;
  
  // Get total count
  const totalResult = await db.select({ count: products.id })
    .from(products)
    .where(and(...conditions));
  const total = totalResult.length;
  
  res.json({
    success: true,
    data: result,
    category: category[0],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});