import axios from "axios";
import * as admin from "firebase-admin";

/**
 * Initiates a call using the Bland.ai API
 * @param name The recipient's name
 * @param phoneNumber The recipient's phone number
 * @param websiteUrl The website URL that was analyzed
 * @return Call details including ID and status
 */
export async function initiateCall(name: string, phoneNumber: string, websiteUrl: string): Promise<any> {
  const db = admin.firestore();
  const BLAND_API_KEY = process.env.BLAND_APIKEY;
  const BLAND_API_URL = "https://api.bland.ai/v1";

  if (!BLAND_API_KEY) {
    throw new Error("Bland.ai API key is not configured. Please set the BLAND_APIKEY environment variable.");
  }

  try {
    // Get the website analysis from Firestore
    const analysisSnapshot = await db.collection("websiteAnalyses")
      .where("websiteUrl", "==", websiteUrl)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    let callScript = "";
    let businessName = "";

    if (!analysisSnapshot.empty) {
      const analysisData = analysisSnapshot.docs[0].data();
      // Extract the call script and business name from the analysis
      callScript = analysisData.analysis?.callScript || "";
      businessName = analysisData.analysis?.businessName || "";

      // If we have analysis data but not the specific fields we need, construct a script from available data
      if (!callScript && analysisData.analysis) {
        console.log("Constructing call script from available analysis data");
        const analysis = analysisData.analysis;
        businessName = analysis.businessName || "the business";
        const summary = analysis.summary || "";
        const questions = analysis.questions || [];

        // Construct a call script using the required format
        callScript = `Hey ${name}, this is Jordan from Gold Strike Media and I see your ${businessName}. `;

        if (summary) {
          callScript += `I understand that ${summary} `;
        }

        callScript += `I'd like to speak with ${name} please. `;

        // Add questions if available
        if (questions.length > 0) {
          callScript += `I wanted to ask a few questions: ${questions.join(" ")} `;
        }

        callScript += "Thank you for your time.";
      }
    } else {
      // Fallback if no analysis is found
      console.log("No analysis found, using fallback script");
      callScript = `Hey ${name}, this is Jordan from Gold Strike Media and I see your business. We help businesses optimize their operations and increase revenue. Would it make sense to set up a short call to discuss how we might be able to help?`;
      businessName = "Unknown Business";
    }

    // Replace placeholders in the call script
    if (callScript) {
      callScript = callScript.replace(/{{name}}/g, name);
      callScript = callScript.replace(/{{businessName}}/g, businessName);
    }

    // Log the call script for debugging
    console.log("Using call script:", callScript.substring(0, 100) + "...");

    // Format the phone number (remove non-digits except leading +)
    const formattedPhone = phoneNumber.startsWith("+") ?
      "+" + phoneNumber.substring(1).replace(/\D/g, "") :
      phoneNumber.replace(/\D/g, "");

    // Headers exactly as shown in the GUI
    const headers = {
      'Authorization': BLAND_API_KEY,
      'Content-Type': 'application/json'
    };

    // Data
    const data = {
      "phone_number": formattedPhone,
      "voice": "Brady",
      "wait_for_greeting": true,
      "record": true,
      "answered_by_enabled": true,
      "noise_cancellation": false,
      "interruption_threshold": 200,
      "block_interruptions": false,
      "max_duration": 12,
      "model": "base",
      "language": "en",
      "background_track": "office",
      "endpoint": "https://api.bland.ai",
      "voicemail_action": "hangup",
      "task": callScript,
      "temperature": 0.7
    };

    // API request exactly as shown in the GUI
    const response = await axios.post(`${BLAND_API_URL}/calls`, data, { headers });

    console.log("Bland.ai API response:", response.data);

    // Return the call details
    return {
      callId: response.data.call_id,
      status: response.data.status,
      details: response.data,
    };
  } catch (error: any) {
    console.error("Bland.ai API error:", error.response?.data || error.message);
    throw new Error("Failed to initiate call with Bland.ai");
  }
}

/**
 * Gets the status of a call from Bland.ai
 * @param callId The ID of the call
 * @return Call status details
 */
export async function getCallStatus(callId: string): Promise<any> {
  const BLAND_API_KEY = process.env.BLAND_APIKEY;
  const BLAND_API_URL = "https://api.bland.ai/v1";

  if (!BLAND_API_KEY) {
    throw new Error("Bland.ai API key is not configured.");
  }

  try {
    const response = await axios.get(`${BLAND_API_URL}/calls/${callId}`, {
      headers: {
        "Authorization": `Bearer ${BLAND_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return {
      callId,
      status: response.data.status,
      details: response.data,
    };
  } catch (error: any) {
    console.error("Bland.ai status check error:", error.response?.data || error.message);
    throw new Error("Failed to get call status from Bland.ai");
  }
}
