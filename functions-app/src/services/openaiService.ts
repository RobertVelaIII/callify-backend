import {OpenAI} from "openai";
import * as admin from "firebase-admin";

/**
 * Extracts domain name from a URL
 * @param url The full website URL
 * @return The domain name
 */
function extractDomainName(url: string): string {
  try {
    // Remove protocol and get domain
    let domain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
    // Remove path, query string, etc.
    domain = domain.split("/")[0];
    return domain;
  } catch (error) {
    console.error("Error extracting domain name:", error);
    return url; // Return original URL if extraction fails
  }
}

/**
 * Analyzes a website and generates a call prompt using OpenAI
 * @param websiteUrl The URL of the website to analyze
 * @return Analysis and call prompt
 */
export async function analyzeWebsite(websiteUrl: string): Promise<any> {
  try {
    console.log("Starting website analysis for:", websiteUrl);

    // Initialize OpenAI client using environment variables
    const apiKey = process.env.OPENAI_APIKEY;
    if (!apiKey) {
      console.error("OpenAI API key is missing from environment variables");
      throw new Error("OpenAI API key is not configured");
    }

    console.log("OpenAI API key found, initializing client");
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Extract domain name for better analysis
    const domain = extractDomainName(websiteUrl);
    console.log("Extracted domain:", domain);

    // Generate analysis using OpenAI's knowledge
    console.log("Sending request to OpenAI");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that creates effective call scripts for a sales agent persona named Janie.
          Your task is to use your knowledge to research information about the website domain provided and create a natural-sounding call script for Janie to use.
          The script should be friendly, professional, and tailored to the specific business being called.
          The goal of the call is to see if the business is interested in the services offered by the person Janie is calling on behalf of.
          Use the variable {{name}} as a placeholder for the person Janie is calling for.
          Use the variable {{businessName}} as a placeholder for the company being called.`,
        },
        {
          role: "user",
          content: `I need to create a call script for our agent, Janie, to call a business with the website: ${websiteUrl} (domain: ${domain}).

          Please use your knowledge to:
          1. Research and identify the business name, industry, and key services/products.
          2. Create a brief summary of what the business likely does.
          3. Generate a natural-sounding call script for Janie. The script must start with "Hello, my name is Janie, and I'm calling on behalf of {{name}}..." and should be directed at {{businessName}}.
          4. Include 2-3 relevant questions for Janie to ask during the call to gauge interest.

          Format your response as JSON with the following structure:
          {
            "businessName": "Name of the business",
            "industry": "Industry category",
            "services": ["Service 1", "Service 2"],
            "summary": "Brief summary of the business",
            "callScript": "Complete call script for Janie, using {{name}} and {{businessName}}.",
            "questions": ["Question 1", "Question 2"]
          }`,
        },
      ],
      response_format: {type: "json_object"},
    });

    // Parse the response
    console.log("Received response from OpenAI");
    const analysisText = completion.choices[0].message.content || "{}";
    const analysis = JSON.parse(analysisText);

    // Store the analysis in Firestore for later use by Bland.ai
    try {
      const db = admin.firestore();
      await db.collection("websiteAnalyses").add({
        websiteUrl,
        domain,
        analysis,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("Analysis stored in Firestore");
    } catch (dbError) {
      console.error("Error storing analysis in Firestore:", dbError);
      // Continue even if storage fails - we'll return the analysis anyway
    }

    console.log("Analysis complete:", JSON.stringify(analysis).substring(0, 100) + "...");
    return analysis;
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error("Failed to analyze website with OpenAI: " + (error instanceof Error ? error.message : String(error)));
  }
}
