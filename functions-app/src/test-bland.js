// Simple test script for Bland.ai API integration
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.callify-backend
dotenv.config({ path: path.resolve(__dirname, '../.env.callify-backend') });

const BLAND_API_KEY = process.env.BLAND_APIKEY;
const BLAND_API_URL = 'https://api.bland.ai/v1';

if (!BLAND_API_KEY) {
  console.error('Error: BLAND_APIKEY environment variable is not set');
  process.exit(1);
}

// Test data with provided phone number
const testData = {
  phoneNumber: '+12063072226', // Using the provided phone number
  name: 'Test User',
  websiteUrl: 'https://apple.com',
  callScript: 'Hello, this is a test call from Callify. We\'re testing our AI-powered phone automation platform. Is this Test User?'
};

async function testBlandApi() {
  try {
    console.log('Testing Bland.ai API with exact GUI format...');
    
    // Format the phone number (remove non-digits except leading +)
    const formattedPhone = testData.phoneNumber.startsWith('+') ?
      '+' + testData.phoneNumber.substring(1).replace(/\D/g, '') :
      testData.phoneNumber.replace(/\D/g, '');
    
    // Headers exactly as shown in the GUI
    const headers = {
      'Authorization': BLAND_API_KEY,
      'Content-Type': 'application/json'
    };

    // Data exactly as shown in the GUI, but with our phone number and adding task
    const data = {
      "phone_number": formattedPhone,
      "task": testData.callScript, // Adding task parameter for the script
      "voice": "June",
      "wait_for_greeting": false,
      "record": true,
      "answered_by_enabled": true,
      "noise_cancellation": false,
      "interruption_threshold": 100,
      "block_interruptions": false,
      "max_duration": 12,
      "model": "base",
      "language": "en",
      "background_track": "none",
      "endpoint": "https://api.bland.ai",
      "voicemail_action": "hangup",
      "json_mode_enabled": false
    };

    // API request exactly as shown in the GUI
    const response = await axios.post(`${BLAND_API_URL}/calls`, data, { headers });
    
    console.log('API call successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return {
      callId: response.data.call_id,
      status: response.data.status,
      details: response.data,
    };
  } catch (error) {
    console.error('Bland.ai API error:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    console.error('Error config:', error.config);
    throw new Error('Failed to initiate call with Bland.ai');
  }
}

// Run the test
testBlandApi()
  .then(result => {
    console.log('Test completed successfully!');
  })
  .catch(error => {
    console.error('Test failed:', error.message);
  });
