import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Scheduled function that runs daily to clean up old rate limit records
 * This helps keep the database clean and efficient
 */
export const cleanupRateLimits = functions.pubsub
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
      } else {
        console.log('No old rate limit records to delete');
      }
      
      return null;
    } catch (error) {
      console.error('Error cleaning up rate limits:', error);
      return null;
    }
  });

/**
 * Scheduled function that runs daily to clean up old website analyses
 * This helps keep the database clean and efficient
 */
export const cleanupWebsiteAnalyses = functions.pubsub
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
      } else {
        console.log('No old website analyses to delete');
      }
      
      return null;
    } catch (error) {
      console.error('Error cleaning up website analyses:', error);
      return null;
    }
  });
