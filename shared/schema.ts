import { pgTable, serial, varchar, text, timestamp, integer, boolean, uuid, decimal, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - Extended for MockPro
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  // MockPro specific fields
  targetCompany: varchar('target_company', { length: 100 }),
  skillLevel: varchar('skill_level', { length: 50 }).default('beginner'), // beginner, intermediate, advanced
  currentRole: varchar('current_role', { length: 100 }),
  experienceYears: integer('experience_years').default(0),
  profilePicture: text('profile_picture'),
  resumeUrl: text('resume_url'),
  googleId: varchar('google_id', { length: 255 }),
  authProvider: varchar('auth_provider', { length: 50 }).default('email'), // email, google
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

// Companies table for MockPro
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  logo: text('logo'),
  description: text('description'),
  industry: varchar('industry', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Interview Questions table
export const interviewQuestions = pgTable('interview_questions', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  question: text('question').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // technical, hr, behavioral
  category: varchar('category', { length: 100 }), // coding, system-design, algorithms, etc.
  difficulty: varchar('difficulty', { length: 20 }).default('medium'), // easy, medium, hard
  companyId: integer('company_id').references(() => companies.id),
  expectedAnswer: text('expected_answer'),
  hints: json('hints'), // Array of hints
  codeTemplate: text('code_template'), // For coding questions
  testCases: json('test_cases'), // For coding questions
  tags: json('tags'), // Array of tags
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Interview Sessions table
export const interviewSessions = pgTable('interview_sessions', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  companyId: integer('company_id').references(() => companies.id),
  type: varchar('type', { length: 50 }).notNull(), // technical, hr, behavioral, mixed
  status: varchar('status', { length: 20 }).default('in_progress'), // in_progress, completed, abandoned
  totalQuestions: integer('total_questions').default(0),
  answeredQuestions: integer('answered_questions').default(0),
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }),
  technicalScore: decimal('technical_score', { precision: 5, scale: 2 }),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }),
  communicationScore: decimal('communication_score', { precision: 5, scale: 2 }),
  duration: integer('duration'), // in minutes
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Interview Responses table
export const interviewResponses = pgTable('interview_responses', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  sessionId: integer('session_id').references(() => interviewSessions.id).notNull(),
  questionId: integer('question_id').references(() => interviewQuestions.id).notNull(),
  userAnswer: text('user_answer'),
  codeSubmission: text('code_submission'), // For coding questions
  timeSpent: integer('time_spent'), // in seconds
  score: decimal('score', { precision: 5, scale: 2 }),
  isCorrect: boolean('is_correct'),
  hintsUsed: integer('hints_used').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Feedback table
export const aiFeedback = pgTable('ai_feedback', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  sessionId: integer('session_id').references(() => interviewSessions.id),
  responseId: integer('response_id').references(() => interviewResponses.id),
  type: varchar('type', { length: 50 }).notNull(), // overall, question_specific, improvement_tip
  feedback: text('feedback').notNull(),
  strengths: json('strengths'), // Array of strengths
  weaknesses: json('weaknesses'), // Array of weaknesses
  improvementTips: json('improvement_tips'), // Array of tips
  score: decimal('score', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Resume Analysis table
export const resumeAnalysis = pgTable('resume_analysis', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  resumeUrl: text('resume_url').notNull(),
  extractedText: text('extracted_text'),
  skills: json('skills'), // Array of detected skills
  experience: json('experience'), // Array of experience items
  education: json('education'), // Array of education items
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }),
  suggestions: json('suggestions'), // Array of improvement suggestions
  atsScore: decimal('ats_score', { precision: 5, scale: 2 }), // ATS compatibility score
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Progress table
export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  totalInterviews: integer('total_interviews').default(0),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }),
  bestScore: decimal('best_score', { precision: 5, scale: 2 }),
  improvementRate: decimal('improvement_rate', { precision: 5, scale: 2 }),
  skillsImproved: json('skills_improved'), // Array of skills with improvement data
  weeklyGoal: integer('weekly_goal').default(3),
  monthlyGoal: integer('monthly_goal').default(12),
  streak: integer('streak').default(0), // Days of consecutive practice
  lastPracticeDate: timestamp('last_practice_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  comments: many(comments),
  // MockPro relations
  interviewSessions: many(interviewSessions),
  resumeAnalysis: many(resumeAnalysis),
  progress: one(userProgress),
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

// MockPro relations
export const companiesRelations = relations(companies, ({ many }) => ({
  questions: many(interviewQuestions),
  sessions: many(interviewSessions),
}));

export const interviewQuestionsRelations = relations(interviewQuestions, ({ one, many }) => ({
  company: one(companies, {
    fields: [interviewQuestions.companyId],
    references: [companies.id],
  }),
  responses: many(interviewResponses),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [interviewSessions.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [interviewSessions.companyId],
    references: [companies.id],
  }),
  responses: many(interviewResponses),
  feedback: many(aiFeedback),
}));

export const interviewResponsesRelations = relations(interviewResponses, ({ one, many }) => ({
  session: one(interviewSessions, {
    fields: [interviewResponses.sessionId],
    references: [interviewSessions.id],
  }),
  question: one(interviewQuestions, {
    fields: [interviewResponses.questionId],
    references: [interviewQuestions.id],
  }),
  feedback: many(aiFeedback),
}));

export const aiFeedbackRelations = relations(aiFeedback, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [aiFeedback.sessionId],
    references: [interviewSessions.id],
  }),
  response: one(interviewResponses, {
    fields: [aiFeedback.responseId],
    references: [interviewResponses.id],
  }),
}));

export const resumeAnalysisRelations = relations(resumeAnalysis, ({ one }) => ({
  user: one(users, {
    fields: [resumeAnalysis.userId],
    references: [users.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
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

// MockPro types
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type NewInterviewQuestion = typeof interviewQuestions.$inferInsert;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type NewInterviewSession = typeof interviewSessions.$inferInsert;
export type InterviewResponse = typeof interviewResponses.$inferSelect;
export type NewInterviewResponse = typeof interviewResponses.$inferInsert;
export type AiFeedback = typeof aiFeedback.$inferSelect;
export type NewAiFeedback = typeof aiFeedback.$inferInsert;
export type ResumeAnalysis = typeof resumeAnalysis.$inferSelect;
export type NewResumeAnalysis = typeof resumeAnalysis.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;