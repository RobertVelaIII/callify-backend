// Scheduled tasks module - temporarily disabled to unblock deployment
// Will be reimplemented after successful deployment

/**
 * Scheduled function that runs daily to clean up old rate limit records
 * This helps keep the database clean and efficient
 * Temporarily commented out to unblock deployment
 */
/* 
export const cleanupRateLimits = functions.https.onRequest(async (req, res) => {
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
 * Temporarily commented out to unblock deployment
 */
/*
export const cleanupWebsiteAnalyses = functions.https.onRequest(async (req, res) => {
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
*/
