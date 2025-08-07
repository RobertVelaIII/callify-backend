import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const CALLS_PER_DAY_LIMIT = 3;

/**
 * Middleware to enforce rate limiting (3 calls per day per IP address)
 */
export const rateLimitMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Skip rate limiting for non-call endpoints
  if (!req.path.includes('/call')) {
    return next();
  }

  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get or create rate limit document
    const rateLimitRef = db.collection('rateLimits').doc(String(ipAddress));
    const rateLimitDoc = await rateLimitRef.get();
    
    let currentCount = 0;
    let currentDate = today;
    
    if (rateLimitDoc.exists) {
      const data = rateLimitDoc.data();
      if (data && data.date === today) {
        currentCount = data.count || 0;
        currentDate = data.date;
      }
    }
    
    // Reset count if it's a new day
    if (currentDate !== today) {
      currentCount = 0;
    }
    
    // Check if limit exceeded
    if (currentCount >= CALLS_PER_DAY_LIMIT) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Limited to ${CALLS_PER_DAY_LIMIT} calls per day. Please try again tomorrow.`,
        limit: CALLS_PER_DAY_LIMIT,
        current: currentCount,
        resetsAt: `${today}T23:59:59Z`
      });
    }
    
    // Allow the request and update the counter
    // We'll increment the counter after the call is successfully initiated
    // This happens in the call service
    res.locals.rateLimit = {
      ipAddress,
      currentCount,
      date: today,
      ref: rateLimitRef
    };
    
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If rate limiting fails, we'll still allow the request to proceed
    next();
  }
};
