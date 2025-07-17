import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';

// Import route handlers
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import productRoutes from './routes/productRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/products', productRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'REST API Server',
    version: '1.0.0',
    endpoints: {
      users: {
        GET: '/api/users - Get all users with pagination',
        POST: '/api/users - Create new user',
        GET_BY_ID: '/api/users/:id - Get user by ID',
        PUT: '/api/users/:id - Update user',
        DELETE: '/api/users/:id - Delete user',
        TOGGLE_STATUS: 'PATCH /api/users/:id/toggle-status - Toggle user status',
      },
      categories: {
        GET: '/api/categories - Get all categories with pagination',
        POST: '/api/categories - Create new category',
        GET_BY_ID: '/api/categories/:id - Get category by ID',
        GET_BY_SLUG: '/api/categories/slug/:slug - Get category by slug',
        PUT: '/api/categories/:id - Update category',
        DELETE: '/api/categories/:id - Delete category',
        GET_ACTIVE: '/api/categories/active - Get active categories',
      },
      posts: {
        GET: '/api/posts - Get all posts with pagination',
        POST: '/api/posts - Create new post',
        GET_BY_ID: '/api/posts/:id - Get post by ID',
        GET_BY_SLUG: '/api/posts/slug/:slug - Get post by slug',
        PUT: '/api/posts/:id - Update post',
        DELETE: '/api/posts/:id - Delete post',
        GET_PUBLISHED: '/api/posts/published - Get published posts',
      },
      comments: {
        GET: '/api/comments - Get all comments with pagination',
        POST: '/api/comments - Create new comment',
        GET_BY_ID: '/api/comments/:id - Get comment by ID',
        PUT: '/api/comments/:id - Update comment',
        DELETE: '/api/comments/:id - Delete comment',
        GET_POST_COMMENTS: '/api/comments/post/:postId - Get comments for post',
        TOGGLE_APPROVAL: 'PATCH /api/comments/:id/toggle-approval - Toggle approval',
      },
      products: {
        GET: '/api/products - Get all products with pagination',
        POST: '/api/products - Create new product',
        GET_BY_ID: '/api/products/:id - Get product by ID',
        GET_BY_SKU: '/api/products/sku/:sku - Get product by SKU',
        PUT: '/api/products/:id - Update product',
        DELETE: '/api/products/:id - Delete product',
        GET_ACTIVE: '/api/products/active - Get active products',
        UPDATE_STOCK: 'PATCH /api/products/:id/stock - Update stock',
      },
    },
  });
});

// 404 handler for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
    console.log(`📁 Database URL: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  }
});

export default app;