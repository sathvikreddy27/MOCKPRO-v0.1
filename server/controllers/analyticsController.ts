import { Request, Response } from 'express';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import db from '../config/database.js';
import { 
  userProgress, 
  interviewSessions, 
  interviewResponses,
  aiFeedback,
  type UserProgress 
} from '../../shared/schema.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Get user progress overview
export const getUserProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  
  // Get or create user progress record
  let progress = await db.select().from(userProgress)
    .where(eq(userProgress.userId, userId))
    .limit(1);
  
  if (!progress.length) {
    // Create initial progress record
    const newProgress = await db.insert(userProgress).values({
      userId,
      totalInterviews: 0,
      averageScore: '0',
      bestScore: '0',
      improvementRate: '0',
      skillsImproved: [],
      weeklyGoal: 3,
      monthlyGoal: 12,
      streak: 0,
      updatedAt: new Date(),
    }).returning();
    
    progress = newProgress;
  }
  
  // Get recent interview statistics
  const recentSessions = await db.select({
    id: interviewSessions.id,
    type: interviewSessions.type,
    overallScore: interviewSessions.overallScore,
    technicalScore: interviewSessions.technicalScore,
    confidenceScore: interviewSessions.confidenceScore,
    communicationScore: interviewSessions.communicationScore,
    completedAt: interviewSessions.completedAt,
  }).from(interviewSessions)
    .where(and(
      eq(interviewSessions.userId, userId),
      eq(interviewSessions.status, 'completed')
    ))
    .orderBy(desc(interviewSessions.completedAt))
    .limit(10);
  
  // Calculate weekly and monthly progress
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const weeklyInterviews = await db.select({ count: sql`count(*)` })
    .from(interviewSessions)
    .where(and(
      eq(interviewSessions.userId, userId),
      eq(interviewSessions.status, 'completed'),
      gte(interviewSessions.completedAt, oneWeekAgo)
    ));
  
  const monthlyInterviews = await db.select({ count: sql`count(*)` })
    .from(interviewSessions)
    .where(and(
      eq(interviewSessions.userId, userId),
      eq(interviewSessions.status, 'completed'),
      gte(interviewSessions.completedAt, oneMonthAgo)
    ));
  
  res.json({
    success: true,
    data: {
      progress: progress[0],
      recentSessions,
      weeklyProgress: {
        completed: Number(weeklyInterviews[0].count),
        goal: progress[0].weeklyGoal,
        percentage: Math.round((Number(weeklyInterviews[0].count) / progress[0].weeklyGoal) * 100),
      },
      monthlyProgress: {
        completed: Number(monthlyInterviews[0].count),
        goal: progress[0].monthlyGoal,
        percentage: Math.round((Number(monthlyInterviews[0].count) / progress[0].monthlyGoal) * 100),
      },
    },
  });
});

// Update user goals
export const updateUserGoals = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { weeklyGoal, monthlyGoal } = req.body;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  
  // Update or create progress record
  const updatedProgress = await db.update(userProgress)
    .set({
      weeklyGoal: weeklyGoal || undefined,
      monthlyGoal: monthlyGoal || undefined,
      updatedAt: new Date(),
    })
    .where(eq(userProgress.userId, userId))
    .returning();
  
  if (!updatedProgress.length) {
    // Create if doesn't exist
    const newProgress = await db.insert(userProgress).values({
      userId,
      totalInterviews: 0,
      averageScore: '0',
      bestScore: '0',
      improvementRate: '0',
      skillsImproved: [],
      weeklyGoal: weeklyGoal || 3,
      monthlyGoal: monthlyGoal || 12,
      streak: 0,
      updatedAt: new Date(),
    }).returning();
    
    return res.json({
      success: true,
      message: 'Goals updated successfully',
      data: newProgress[0],
    });
  }
  
  res.json({
    success: true,
    message: 'Goals updated successfully',
    data: updatedProgress[0],
  });
});

// Get performance analytics
export const getPerformanceAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { period = '30' } = req.query; // days
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));
  
  // Get sessions in the period
  const sessions = await db.select({
    id: interviewSessions.id,
    type: interviewSessions.type,
    overallScore: interviewSessions.overallScore,
    technicalScore: interviewSessions.technicalScore,
    confidenceScore: interviewSessions.confidenceScore,
    communicationScore: interviewSessions.communicationScore,
    completedAt: interviewSessions.completedAt,
  }).from(interviewSessions)
    .where(and(
      eq(interviewSessions.userId, userId),
      eq(interviewSessions.status, 'completed'),
      gte(interviewSessions.completedAt, daysAgo)
    ))
    .orderBy(desc(interviewSessions.completedAt));
  
  // Calculate trends
  const scoresByDate = sessions.reduce((acc: any, session) => {
    const date = session.completedAt?.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({
      overall: parseFloat(session.overallScore || '0'),
      technical: parseFloat(session.technicalScore || '0'),
      confidence: parseFloat(session.confidenceScore || '0'),
      communication: parseFloat(session.communicationScore || '0'),
    });
    return acc;
  }, {});
  
  // Calculate averages by date
  const performanceData = Object.entries(scoresByDate).map(([date, scores]: [string, any]) => ({
    date,
    overallScore: scores.reduce((sum: number, s: any) => sum + s.overall, 0) / scores.length,
    technicalScore: scores.reduce((sum: number, s: any) => sum + s.technical, 0) / scores.length,
    confidenceScore: scores.reduce((sum: number, s: any) => sum + s.confidence, 0) / scores.length,
    communicationScore: scores.reduce((sum: number, s: any) => sum + s.communication, 0) / scores.length,
    sessionCount: scores.length,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate improvement rate
  const improvementRate = performanceData.length >= 2 
    ? ((performanceData[performanceData.length - 1].overallScore - performanceData[0].overallScore) / performanceData[0].overallScore) * 100
    : 0;
  
  // Performance by interview type
  const performanceByType = sessions.reduce((acc: any, session) => {
    if (!acc[session.type]) {
      acc[session.type] = [];
    }
    acc[session.type].push(parseFloat(session.overallScore || '0'));
    return acc;
  }, {});
  
  const typeAverages = Object.entries(performanceByType).map(([type, scores]: [string, any]) => ({
    type,
    averageScore: scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length,
    sessionCount: scores.length,
  }));
  
  res.json({
    success: true,
    data: {
      performanceData,
      improvementRate: Math.round(improvementRate * 100) / 100,
      performanceByType: typeAverages,
      totalSessions: sessions.length,
      averageScore: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + parseFloat(s.overallScore || '0'), 0) / sessions.length
        : 0,
    },
  });
});

// Get skill analysis
export const getSkillAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }
  
  // Get all user responses with question categories
  const responses = await db.select({
    score: interviewResponses.score,
    isCorrect: interviewResponses.isCorrect,
    questionType: sql`${interviewSessions.type}`,
    timeSpent: interviewResponses.timeSpent,
  }).from(interviewResponses)
    .leftJoin(interviewSessions, eq(interviewResponses.sessionId, interviewSessions.id))
    .where(and(
      eq(interviewSessions.userId, userId),
      eq(interviewSessions.status, 'completed')
    ));
  
  // Analyze performance by skill category
  const skillPerformance = responses.reduce((acc: any, response) => {
    const type = response.questionType || 'general';
    if (!acc[type]) {
      acc[type] = {
        totalQuestions: 0,
        correctAnswers: 0,
        totalScore: 0,
        totalTime: 0,
      };
    }
    
    acc[type].totalQuestions++;
    if (response.isCorrect) acc[type].correctAnswers++;
    acc[type].totalScore += parseFloat(response.score || '0');
    acc[type].totalTime += response.timeSpent || 0;
    
    return acc;
  }, {});
  
  // Calculate skill metrics
  const skillAnalysis = Object.entries(skillPerformance).map(([skill, data]: [string, any]) => ({
    skill,
    accuracy: Math.round((data.correctAnswers / data.totalQuestions) * 100),
    averageScore: Math.round(data.totalScore / data.totalQuestions),
    averageTime: Math.round(data.totalTime / data.totalQuestions),
    totalQuestions: data.totalQuestions,
    strengthLevel: getStrengthLevel(data.correctAnswers / data.totalQuestions),
  }));
  
  // Get recent feedback for improvement suggestions
  const recentFeedback = await db.select({
    feedback: aiFeedback.feedback,
    strengths: aiFeedback.strengths,
    weaknesses: aiFeedback.weaknesses,
    improvementTips: aiFeedback.improvementTips,
  }).from(aiFeedback)
    .leftJoin(interviewSessions, eq(aiFeedback.sessionId, interviewSessions.id))
    .where(and(
      eq(interviewSessions.userId, userId),
      eq(aiFeedback.type, 'overall')
    ))
    .orderBy(desc(aiFeedback.createdAt))
    .limit(5);
  
  res.json({
    success: true,
    data: {
      skillAnalysis,
      recentFeedback,
      overallStrengths: extractCommonItems(recentFeedback.map(f => f.strengths).filter(Boolean)),
      overallWeaknesses: extractCommonItems(recentFeedback.map(f => f.weaknesses).filter(Boolean)),
      recommendedActions: extractCommonItems(recentFeedback.map(f => f.improvementTips).filter(Boolean)),
    },
  });
});

// Helper functions
function getStrengthLevel(accuracy: number): string {
  if (accuracy >= 0.8) return 'Strong';
  if (accuracy >= 0.6) return 'Good';
  if (accuracy >= 0.4) return 'Fair';
  return 'Needs Improvement';
}

function extractCommonItems(arrays: any[][]): string[] {
  const itemCounts: { [key: string]: number } = {};
  
  arrays.forEach(array => {
    if (Array.isArray(array)) {
      array.forEach(item => {
        if (typeof item === 'string') {
          itemCounts[item] = (itemCounts[item] || 0) + 1;
        }
      });
    }
  });
  
  return Object.entries(itemCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([item]) => item);
}