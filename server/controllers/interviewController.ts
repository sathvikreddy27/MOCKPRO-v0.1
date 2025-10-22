import { Request, Response } from 'express';
import { eq, and, inArray, desc, asc, sql } from 'drizzle-orm';
import db from '../config/database.js';
import { 
  interviewQuestions, 
  interviewSessions, 
  interviewResponses,
  aiFeedback,
  companies,
  type InterviewQuestion, 
  type NewInterviewQuestion,
  type InterviewSession,
  type NewInterviewSession,
  type InterviewResponse,
  type NewInterviewResponse
} from '../../shared/schema.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { ValidatedRequest } from '../middleware/validation.js';

// Get interview questions with filtering
export const getInterviewQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    type, 
    difficulty, 
    companyId, 
    category,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query as any;
  
  const offset = (page - 1) * limit;
  
  let query = db.select({
    id: interviewQuestions.id,
    uuid: interviewQuestions.uuid,
    question: interviewQuestions.question,
    type: interviewQuestions.type,
    category: interviewQuestions.category,
    difficulty: interviewQuestions.difficulty,
    companyId: interviewQuestions.companyId,
    companyName: companies.name,
    tags: interviewQuestions.tags,
    isActive: interviewQuestions.isActive,
    createdAt: interviewQuestions.createdAt,
  }).from(interviewQuestions)
    .leftJoin(companies, eq(interviewQuestions.companyId, companies.id));
  
  // Add filters
  const conditions = [eq(interviewQuestions.isActive, true)];
  
  if (type) {
    conditions.push(eq(interviewQuestions.type, type));
  }
  
  if (difficulty) {
    conditions.push(eq(interviewQuestions.difficulty, difficulty));
  }
  
  if (companyId) {
    conditions.push(eq(interviewQuestions.companyId, parseInt(companyId)));
  }
  
  if (category) {
    conditions.push(eq(interviewQuestions.category, category));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  // Add sorting
  const sortColumn = interviewQuestions[sortBy as keyof typeof interviewQuestions] || interviewQuestions.createdAt;
  const orderFunction = sortOrder === 'asc' ? asc : desc;
  query = query.orderBy(orderFunction(sortColumn));
  
  // Add pagination
  query = query.limit(limit).offset(offset);
  
  const result = await query;
  
  // Get total count
  let countQuery = db.select({ count: sql`count(*)` }).from(interviewQuestions);
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions));
  }
  const totalResult = await countQuery;
  const total = Number(totalResult[0].count);
  
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

// Get random questions for interview session
export const getRandomQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { type, difficulty, companyId, count = 5 } = req.query as any;
  
  let query = db.select().from(interviewQuestions);
  
  // Add filters
  const conditions = [eq(interviewQuestions.isActive, true)];
  
  if (type) {
    conditions.push(eq(interviewQuestions.type, type));
  }
  
  if (difficulty) {
    conditions.push(eq(interviewQuestions.difficulty, difficulty));
  }
  
  if (companyId) {
    conditions.push(eq(interviewQuestions.companyId, parseInt(companyId)));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  // Get random questions using SQL
  const result = await query.orderBy(sql`RANDOM()`).limit(parseInt(count));
  
  // Remove sensitive data (expected answers, hints) for the interview
  const questionsForInterview = result.map(q => ({
    id: q.id,
    uuid: q.uuid,
    question: q.question,
    type: q.type,
    category: q.category,
    difficulty: q.difficulty,
    codeTemplate: q.codeTemplate,
    tags: q.tags,
  }));
  
  res.json({
    success: true,
    data: questionsForInterview,
  });
});

// Start new interview session
export const startInterviewSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { type, companyId, questionIds } = req.body;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  
  // Create new interview session
  const newSession = await db.insert(interviewSessions).values({
    userId,
    companyId: companyId || null,
    type,
    totalQuestions: questionIds?.length || 0,
    answeredQuestions: 0,
    status: 'in_progress',
    updatedAt: new Date(),
  }).returning();
  
  res.status(201).json({
    success: true,
    message: 'Interview session started successfully',
    data: newSession[0],
  });
});

// Submit answer to interview question
export const submitAnswer = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { sessionId, questionId, userAnswer, codeSubmission, timeSpent } = req.body;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  
  // Verify session belongs to user
  const session = await db.select().from(interviewSessions)
    .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, userId)))
    .limit(1);
  
  if (!session.length) {
    throw new AppError('Interview session not found', 404);
  }
  
  if (session[0].status !== 'in_progress') {
    throw new AppError('Interview session is not active', 400);
  }
  
  // Get the question to check expected answer
  const question = await db.select().from(interviewQuestions)
    .where(eq(interviewQuestions.id, questionId))
    .limit(1);
  
  if (!question.length) {
    throw new AppError('Question not found', 404);
  }
  
  // Simple scoring logic (can be enhanced with AI)
  let score = 0;
  let isCorrect = false;
  
  if (question[0].expectedAnswer && userAnswer) {
    // Basic text similarity check (in real implementation, use AI for better scoring)
    const similarity = calculateTextSimilarity(userAnswer.toLowerCase(), question[0].expectedAnswer.toLowerCase());
    score = similarity * 100;
    isCorrect = similarity > 0.6;
  }
  
  // Save response
  const response = await db.insert(interviewResponses).values({
    sessionId,
    questionId,
    userAnswer,
    codeSubmission,
    timeSpent,
    score: score.toString(),
    isCorrect,
    updatedAt: new Date(),
  }).returning();
  
  // Update session answered questions count
  await db.update(interviewSessions)
    .set({
      answeredQuestions: sql`${interviewSessions.answeredQuestions} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(interviewSessions.id, sessionId));
  
  res.json({
    success: true,
    message: 'Answer submitted successfully',
    data: {
      response: response[0],
      score,
      isCorrect,
    },
  });
});

// Complete interview session
export const completeInterviewSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { sessionId } = req.body;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  
  // Verify session belongs to user
  const session = await db.select().from(interviewSessions)
    .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, userId)))
    .limit(1);
  
  if (!session.length) {
    throw new AppError('Interview session not found', 404);
  }
  
  // Get all responses for this session
  const responses = await db.select().from(interviewResponses)
    .where(eq(interviewResponses.sessionId, sessionId));
  
  // Calculate overall scores
  const totalScore = responses.reduce((sum, r) => sum + parseFloat(r.score || '0'), 0);
  const averageScore = responses.length > 0 ? totalScore / responses.length : 0;
  
  // Calculate duration (in minutes)
  const startTime = new Date(session[0].startedAt);
  const endTime = new Date();
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  
  // Update session with completion data
  const updatedSession = await db.update(interviewSessions)
    .set({
      status: 'completed',
      overallScore: averageScore.toString(),
      technicalScore: averageScore.toString(), // Can be calculated separately
      confidenceScore: Math.min(100, averageScore + 10).toString(), // Placeholder logic
      communicationScore: Math.min(100, averageScore + 5).toString(), // Placeholder logic
      duration,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(interviewSessions.id, sessionId))
    .returning();
  
  // Generate AI feedback (placeholder - in real implementation, call AI service)
  await generateAIFeedback(sessionId, responses, averageScore);
  
  res.json({
    success: true,
    message: 'Interview session completed successfully',
    data: updatedSession[0],
  });
});

// Get user's interview sessions
export const getUserInterviewSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { page = 1, limit = 10, status } = req.query as any;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  
  const offset = (page - 1) * limit;
  
  let query = db.select({
    id: interviewSessions.id,
    uuid: interviewSessions.uuid,
    type: interviewSessions.type,
    status: interviewSessions.status,
    totalQuestions: interviewSessions.totalQuestions,
    answeredQuestions: interviewSessions.answeredQuestions,
    overallScore: interviewSessions.overallScore,
    technicalScore: interviewSessions.technicalScore,
    confidenceScore: interviewSessions.confidenceScore,
    communicationScore: interviewSessions.communicationScore,
    duration: interviewSessions.duration,
    companyName: companies.name,
    startedAt: interviewSessions.startedAt,
    completedAt: interviewSessions.completedAt,
  }).from(interviewSessions)
    .leftJoin(companies, eq(interviewSessions.companyId, companies.id))
    .where(eq(interviewSessions.userId, userId));
  
  if (status) {
    query = query.where(and(eq(interviewSessions.userId, userId), eq(interviewSessions.status, status)));
  }
  
  query = query.orderBy(desc(interviewSessions.startedAt))
    .limit(limit)
    .offset(offset);
  
  const result = await query;
  
  res.json({
    success: true,
    data: result,
  });
});

// Get interview session details
export const getInterviewSessionDetails = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { sessionId } = req.params;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  
  // Get session details
  const session = await db.select().from(interviewSessions)
    .where(and(eq(interviewSessions.id, parseInt(sessionId)), eq(interviewSessions.userId, userId)))
    .limit(1);
  
  if (!session.length) {
    throw new AppError('Interview session not found', 404);
  }
  
  // Get responses with questions
  const responses = await db.select({
    id: interviewResponses.id,
    userAnswer: interviewResponses.userAnswer,
    codeSubmission: interviewResponses.codeSubmission,
    timeSpent: interviewResponses.timeSpent,
    score: interviewResponses.score,
    isCorrect: interviewResponses.isCorrect,
    question: interviewQuestions.question,
    questionType: interviewQuestions.type,
    questionCategory: interviewQuestions.category,
    questionDifficulty: interviewQuestions.difficulty,
    expectedAnswer: interviewQuestions.expectedAnswer,
  }).from(interviewResponses)
    .leftJoin(interviewQuestions, eq(interviewResponses.questionId, interviewQuestions.id))
    .where(eq(interviewResponses.sessionId, parseInt(sessionId)));
  
  // Get AI feedback
  const feedback = await db.select().from(aiFeedback)
    .where(eq(aiFeedback.sessionId, parseInt(sessionId)));
  
  res.json({
    success: true,
    data: {
      session: session[0],
      responses,
      feedback,
    },
  });
});

// Helper functions
function calculateTextSimilarity(text1: string, text2: string): number {
  // Simple word overlap calculation
  const words1 = text1.split(' ').filter(w => w.length > 2);
  const words2 = text2.split(' ').filter(w => w.length > 2);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return union.length > 0 ? intersection.length / union.length : 0;
}

async function generateAIFeedback(sessionId: number, responses: any[], averageScore: number) {
  // Placeholder AI feedback generation
  // In real implementation, this would call an AI service like OpenAI
  
  const feedbackText = averageScore >= 80 
    ? "Excellent performance! You demonstrated strong technical knowledge and clear communication."
    : averageScore >= 60
    ? "Good effort! There are some areas for improvement, but you're on the right track."
    : "Keep practicing! Focus on understanding core concepts and improving your problem-solving approach.";
  
  const strengths = averageScore >= 70 
    ? ["Clear communication", "Good problem-solving approach", "Technical knowledge"]
    : ["Willingness to learn", "Basic understanding"];
  
  const weaknesses = averageScore < 70 
    ? ["Technical depth", "Problem-solving speed", "Code optimization"]
    : ["Minor optimization opportunities"];
  
  const improvementTips = [
    "Practice more coding problems",
    "Review system design concepts",
    "Work on communication skills",
    "Study company-specific technologies"
  ];
  
  await db.insert(aiFeedback).values({
    sessionId,
    type: 'overall',
    feedback: feedbackText,
    strengths,
    weaknesses,
    improvementTips,
    score: averageScore.toString(),
  });
}