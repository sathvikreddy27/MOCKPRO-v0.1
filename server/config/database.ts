import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../../shared/schema.js';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not configured - using demo connection');
  console.warn('📝 Please set DATABASE_URL in .env for production use');
  process.env.DATABASE_URL = 'postgresql://demo:demo@localhost:5432/demo_db';
}

let db: any;

try {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
  console.log('✅ Database connection initialized');
} catch (error) {
  console.warn('⚠️  Database connection failed - API will be limited');
  console.warn('🔧 Error:', error instanceof Error ? error.message : 'Unknown error');
  
  // Create a mock db object that won't crash the server
  db = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }),
    insert: () => ({ values: () => ({ returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    delete: () => ({ where: () => Promise.resolve() }),
  };
}

export { db };
export default db;