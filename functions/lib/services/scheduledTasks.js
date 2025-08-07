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
exports.cleanupWebsiteAnalyses = exports.cleanupRateLimits = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Scheduled function that runs daily to clean up old rate limit records
 * This helps keep the database clean and efficient
 */
exports.cleanupRateLimits = functions.pubsub
    .schedule('0 0 * * *') // Run at midnight every day
    .timeZone('America/Chicago') // Central Time
    .onRun(async (context) => {
    try {
        // Get date for records older than 7 days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD
        // Query for old records
        const oldRecordsQuery = await db.collection('rateLimits')
            .where('date', '<', cutoffDateStr)
            .get();
        // Delete old records
        const batch = db.batch();
        oldRecordsQuery.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // Commit the batch
        if (oldRecordsQuery.docs.length > 0) {
            await batch.commit();
            console.log(`Deleted ${oldRecordsQuery.docs.length} old rate limit records`);
        }
        else {
            console.log('No old rate limit records to delete');
        }
        return null;
    }
    catch (error) {
        console.error('Error cleaning up rate limits:', error);
        return null;
    }
});
/**
 * Scheduled function that runs daily to clean up old website analyses
 * This helps keep the database clean and efficient
 */
exports.cleanupWebsiteAnalyses = functions.pubsub
    .schedule('0 1 * * *') // Run at 1 AM every day
    .timeZone('America/Chicago') // Central Time
    .onRun(async (context) => {
    try {
        // Get timestamp for records older than 30 days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        // Query for old records
        const oldRecordsQuery = await db.collection('websiteAnalyses')
            .where('timestamp', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
            .get();
        // Delete old records
        const batch = db.batch();
        oldRecordsQuery.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // Commit the batch
        if (oldRecordsQuery.docs.length > 0) {
            await batch.commit();
            console.log(`Deleted ${oldRecordsQuery.docs.length} old website analyses`);
        }
        else {
            console.log('No old website analyses to delete');
        }
        return null;
    }
    catch (error) {
        console.error('Error cleaning up website analyses:', error);
        return null;
    }
});
//# sourceMappingURL=scheduledTasks.js.map