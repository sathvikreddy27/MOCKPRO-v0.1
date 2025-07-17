import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductByUuid,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  updateProductStock,
  getActiveProducts,
  getLowStockProducts,
  getProductsByCategory,
} from '../controllers/productController.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import {
  createProductSchema,
  updateProductSchema,
  idParamSchema,
  uuidParamSchema,
  paginationSchema,
} from '../utils/validation.js';

const router = Router();

// GET /api/products - Get all products with pagination and filtering
router.get('/', validateQuery(paginationSchema), getProducts);

// GET /api/products/active - Get only active products (public endpoint)
router.get('/active', validateQuery(paginationSchema), getActiveProducts);

// GET /api/products/low-stock - Get low stock products
router.get('/low-stock', getLowStockProducts);

// GET /api/products/category/:categoryId - Get products by category
router.get('/category/:categoryId', validateParams(idParamSchema), validateQuery(paginationSchema), getProductsByCategory);

// GET /api/products/:id - Get product by ID
router.get('/:id', validateParams(idParamSchema), getProductById);

// GET /api/products/uuid/:uuid - Get product by UUID
router.get('/uuid/:uuid', validateParams(uuidParamSchema), getProductByUuid);

// GET /api/products/sku/:sku - Get product by SKU
router.get('/sku/:sku', getProductBySku);

// POST /api/products - Create new product
router.post('/', validateBody(createProductSchema), createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', validateParams(idParamSchema), validateBody(updateProductSchema), updateProduct);

// DELETE /api/products/:id - Delete product
router.delete('/:id', validateParams(idParamSchema), deleteProduct);

// PATCH /api/products/:id/toggle-status - Toggle product active status
router.patch('/:id/toggle-status', validateParams(idParamSchema), toggleProductStatus);

// PATCH /api/products/:id/stock - Update product stock
router.patch('/:id/stock', validateParams(idParamSchema), updateProductStock);

export default router;