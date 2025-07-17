const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'REST API Server - Demo Mode',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health - Server health check',
      api: 'GET /api - This documentation',
      users: 'GET /api/users - Get all users (demo)',
      posts: 'GET /api/posts - Get all posts (demo)',
      products: 'GET /api/products - Get all products (demo)',
    },
    note: 'This is a simplified demo server. The full TypeScript server with database is in server/index.ts'
  });
});

// Demo API endpoints
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
    ],
    message: 'Demo users data'
  });
});

app.get('/api/posts', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, title: 'Getting Started with REST APIs', content: 'Learn how to build REST APIs...', author: 'John Doe' },
      { id: 2, title: 'Express.js Best Practices', content: 'Follow these patterns...', author: 'Jane Smith' }
    ],
    message: 'Demo posts data'
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Laptop', price: 999.99, stock: 10, sku: 'LAP-001' },
      { id: 2, name: 'Mouse', price: 29.99, stock: 50, sku: 'MOU-001' }
    ],
    message: 'Demo products data'
  });
});

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/health', '/api', '/api/users', '/api/posts', '/api/products']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`👥 Demo Users: http://localhost:${PORT}/api/users`);
  console.log(`📝 Demo Posts: http://localhost:${PORT}/api/posts`);
  console.log(`🛍️  Demo Products: http://localhost:${PORT}/api/products`);
  console.log(`\n📝 Note: This is a demo server. Full TypeScript server is in server/index.ts`);
});

module.exports = app;