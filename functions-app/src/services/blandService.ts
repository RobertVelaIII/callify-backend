import axios from 'axios';
import * as admin from 'firebase-admin';


/**
 * Initiates a call using the Bland.ai API
 * @param name The recipient's name
 * @param phoneNumber The recipient's phone number
 * @param websiteUrl The website URL that was analyzed
 * @returns Call details including ID and status
 */
export async function initiateCall(name: string, phoneNumber: string, websiteUrl: string): Promise<any> {
  const db = admin.firestore();
  const BLAND_API_KEY = process.env.BLAND_APIKEY;
  const BLAND_API_URL = 'https://api.bland.ai/v1';

  if (!BLAND_API_KEY) {
    throw new Error('Bland.ai API key is not configured. Set it with `firebase functions:config:set bland.apikey="YOUR_KEY"`');
  }

  try {
    // Get the website analysis from Firestore
    const analysisSnapshot = await db.collection('websiteAnalyses')
      .where('websiteUrl', '==', websiteUrl)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    let callScript = '';
    let businessName = '';
    
    if (!analysisSnapshot.empty) {
      const analysisData = analysisSnapshot.docs[0].data();
      callScript = analysisData.analysis?.callScript || '';
      businessName = analysisData.analysis?.businessName || '';
    } else {
      // Fallback if no analysis is found
      callScript = `Hello, this is a test call from Callify. We're testing our AI-powered phone automation platform. Is this ${name}?`;
      businessName = 'Unknown Business';
    }
    
    // Format the phone number (remove non-digits except leading +)
    const formattedPhone = phoneNumber.startsWith('+') 
      ? '+' + phoneNumber.substring(1).replace(/\D/g, '')
      : phoneNumber.replace(/\D/g, '');
    
    // Make the API call to Bland.ai
    const response = await axios.post(`${BLAND_API_URL}/calls`, {
      phone_number: formattedPhone,
      task: callScript,
      voice: 'male',
      reduce_latency: true,
      wait_for_greeting: true,
      metadata: {
        name,
        websiteUrl,
        businessName
      }
    }, {
      headers: {
        'Authorization': `Bearer ${BLAND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Return the call details
    return {
      callId: response.data.call_id,
      status: response.data.status,
      details: response.data
    };
  } catch (error: any) {
    console.error('Bland.ai API error:', error.response?.data || error.message);
    throw new Error('Failed to initiate call with Bland.ai');
  }
}

/**
 * Gets the status of a call from Bland.ai
 * @param callId The ID of the call
 * @returns Call status details
 */
export async function getCallStatus(callId: string): Promise<any> {
  const BLAND_API_KEY = process.env.BLAND_APIKEY;
  const BLAND_API_URL = 'https://api.bland.ai/v1';

  if (!BLAND_API_KEY) {
    throw new Error('Bland.ai API key is not configured.');
  }

  try {
    const response = await axios.get(`${BLAND_API_URL}/calls/${callId}`, {
      headers: {
        'Authorization': `Bearer ${BLAND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      callId,
      status: response.data.status,
      details: response.data
    };
  } catch (error: any) {
    console.error('Bland.ai status check error:', error.response?.data || error.message);
    throw new Error('Failed to get call status from Bland.ai');
  }
}
