"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const CALLS_PER_DAY_LIMIT = 3;
/**
 * Middleware to enforce rate limiting (3 calls per day per IP address)
 */
const rateLimitMiddleware = async (req, res, next) => {
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
    }
    catch (error) {
        console.error('Rate limiting error:', error);
        // If rate limiting fails, we'll still allow the request to proceed
        next();
    }
};
exports.rateLimitMiddleware = rateLimitMiddleware;
//# sourceMappingURL=rateLimit.js.map