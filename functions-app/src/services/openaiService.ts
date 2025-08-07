import {OpenAI} from "openai";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
import cheerio from "cheerio";

// Add type for fetch response
type FetchError = {
  message: string;
};

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
 * Fetches and extracts content from a website URL
 * @param url The URL to fetch content from
 * @return The extracted text content from the website
 */
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    console.log("Fetching content from URL:", url);
    
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Fetch the website content
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Use cheerio to parse HTML and extract text content
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, noscript, iframe').remove();
    
    // Extract text from body, focusing on important elements
    const title = $('title').text() || '';
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const h1Text = $('h1').map((i: number, el: any) => $(el).text()).get().join(' ');
    const h2Text = $('h2').map((i: number, el: any) => $(el).text()).get().join(' ');
    const bodyText = $('body').text();
    
    // Combine all text, clean it up and limit length
    let combinedText = `TITLE: ${title}\n\nDESCRIPTION: ${metaDescription}\n\nHEADINGS: ${h1Text} ${h2Text}\n\nCONTENT: ${bodyText}`;
    combinedText = combinedText.replace(/\s+/g, ' ').trim();
    
    // Limit content length to avoid token limits
    const maxLength = 6000;
    if (combinedText.length > maxLength) {
      combinedText = combinedText.substring(0, maxLength) + '... [content truncated]';
    }
    
    console.log("Successfully fetched and parsed website content");
    return combinedText;
  } catch (error) {
    console.error("Error fetching website content:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `Failed to fetch website content: ${errorMessage}. Please analyze based on the domain name only.`;
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
    
    // Fetch actual website content
    console.log("Fetching website content...");
    const websiteContent = await fetchWebsiteContent(websiteUrl);
    console.log("Website content fetched, length:", websiteContent.length);

    // Generate analysis using the actual website content
    console.log("Sending request to OpenAI with actual website content");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that creates effective call scripts for a sales agent persona named Janie.
          Your task is to analyze the provided website content and create a natural-sounding call script for Janie to use.
          The script should be friendly, professional, and tailored to the specific business being called.
          The goal of the call is to see if the business is interested in the services offered by the person Janie is calling on behalf of.
          
          ENTITY ROLES - EXTREMELY IMPORTANT:
          - {{name}} is the INDIVIDUAL PERSON that Janie is calling on behalf of. This is Janie's client/employer.
          - {{businessName}} is the COMPANY/BUSINESS that Janie is calling. This is the target of the call.
          
          CRITICAL INSTRUCTIONS:
          1. You MUST base your analysis EXCLUSIVELY on the provided website content.
          2. DO NOT use any prior knowledge about the domain name or business.
          3. DO NOT make assumptions about the business based on the domain name.
          4. If the website content is insufficient to determine certain information, state "Unknown" for that field rather than guessing.
          5. Pay special attention to the website's title, headings, and product categories to determine the actual business type.
          6. Look for copyright information, about pages, or contact information to determine the actual business name.
          7. NEVER classify a business as landscaping, lawn care, or gardening unless the website content explicitly mentions these services.
          8. ALWAYS structure the call script with Janie introducing herself, stating she's calling on behalf of {{name}} (the PERSON), and then mentioning she's calling {{businessName}} (the BUSINESS).
          9. NEVER introduce {{name}} as a business or {{businessName}} as a person.`,
        },
        {
          role: "user",
          content: `I need to create a call script for our agent, Janie, to call a business with the website: ${websiteUrl}

          Here is the actual content from the website:
          ${websiteContent}

          Based EXCLUSIVELY on this website content (NOT your general knowledge or the domain name), please:
          1. Identify the business name, industry, and key services/products.
          2. Create a brief summary of what the business does.
          3. Generate a natural-sounding call script for Janie. The script must start with "Hello, my name is Janie, and I'm calling on behalf of {{name}}..." and should be directed at {{businessName}}.
          4. Include 2-3 relevant questions for Janie to ask during the call to gauge interest.

          Format your response as JSON with the following structure:
          {
            "businessName": "Name of the business as it appears on the website",
            "industry": "Industry category based ONLY on website content",
            "services": ["Service/Product 1", "Service/Product 2"],
            "summary": "Brief summary of the business based ONLY on website content",
            "callScript": "Complete call script for Janie, using {{name}} and {{businessName}}.",
            "questions": ["Question 1", "Question 2"]
          }
          
          If you cannot determine any field with certainty from the website content, use "Unknown" for that field.`,
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
