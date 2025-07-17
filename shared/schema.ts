import { pgTable, serial, varchar, text, timestamp, integer, boolean, uuid, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Posts table
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft, published, archived
  viewCount: integer('view_count').default(0).notNull(),
  authorId: integer('author_id').references(() => users.id).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Comments table
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id).notNull(),
  postId: integer('post_id').references(() => posts.id).notNull(),
  parentId: integer('parent_id').references(() => comments.id), // for nested comments
  isApproved: boolean('is_approved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Products table (e-commerce example)
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').default(0).notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  categoryId: integer('category_id').references(() => categories.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
  products: many(products),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;