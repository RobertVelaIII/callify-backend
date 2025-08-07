import express from 'express';
import * as admin from 'firebase-admin';
import { initiateCall } from '../services/blandService';

const router = express.Router();
const db = admin.firestore();

/**
 * POST /call
 * Initiates a call using Bland.ai API
 */
router.post('/', async (req, res) => {
  try {
    const { name, phoneNumber, websiteUrl } = req.body;
    
    // Validate required fields
    if (!name || !phoneNumber || !websiteUrl) {
      return res.status(400).json({ 
        error: 'Missing required parameters', 
        message: 'Name, phone number, and website URL are required' 
      });
    }
    
    // Validate phone number format (simple validation)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      return res.status(400).json({
        error: 'Invalid phone number',
        message: 'Please provide a valid phone number'
      });
    }
    
    // Get the website analysis from Firestore or generate it if not found
    // For now, we'll assume it's already been generated
    
    // Update rate limit counter
    if (res.locals.rateLimit) {
      const { ref, currentCount, date } = res.locals.rateLimit;
      await ref.set({
        count: currentCount + 1,
        date,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Initiate the call using Bland.ai
    const callResult = await initiateCall(name, phoneNumber, websiteUrl);
    
    // Store call details in Firestore
    await db.collection('callLogs').add({
      name,
      phoneNumber,
      websiteUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      callId: callResult.callId,
      status: callResult.status,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
    });
    
    return res.status(200).json({
      success: true,
      message: 'Call initiated successfully',
      callId: callResult.callId,
      status: callResult.status
    });
  } catch (error: any) {
    console.error('Call initiation error:', error);
    return res.status(500).json({
      error: 'Call failed',
      message: error.message || 'Failed to initiate call'
    });
  }
});

/**
 * GET /call/:callId
 * Gets the status of a call
 */
router.get('/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    
    // Get call status from Bland.ai
    // This will be implemented in the blandService
    
    return res.status(200).json({
      success: true,
      callId,
      status: 'pending' // Placeholder
    });
  } catch (error: any) {
    console.error('Call status error:', error);
    return res.status(500).json({
      error: 'Status check failed',
      message: error.message || 'Failed to check call status'
    });
  }
});

export const callRoutes = router;
