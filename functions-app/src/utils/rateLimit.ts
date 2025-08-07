import {Request, Response, NextFunction} from "express";
import * as admin from "firebase-admin";

const MAX_CALLS_PER_DAY = 3;

/**
 * Middleware to enforce a rate limit on API calls based on IP address.
 */
export const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
  const db = admin.firestore();
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown-ip";
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const rateLimitRef = db.collection("rateLimits").doc(`${ip}_${today}`);

  try {
    const doc = await rateLimitRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data && data.count >= MAX_CALLS_PER_DAY) {
        return res.status(429).send({error: "Too many requests. Please try again tomorrow."});
      }
    }

    // If document doesn't exist or count is within limit, proceed
    const currentCount = doc.exists ? (doc.data()?.count || 0) : 0;
    await rateLimitRef.set({
      count: currentCount + 1,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    return next();
  } catch (error) {
    console.error("Error in rate limiting middleware:", error);
    // In case of an error, we'll allow the request to proceed to not block legitimate users.
    return next();
  }
};
