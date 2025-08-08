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
          content: `SYSTEM INSTRUCTIONS - EXTREMELY IMPORTANT:

ENTITY ROLES:
- Jordan is the AI sales development representative making outbound calls.
- Goldstrike Media is the company Jordan works for.
- {{businessName}} is the prospect's business we are calling.
- {{prospectName}} is the name of the contact person at the prospect's business (if available).

MISSION:
Jordan's role is to call on behalf of Goldstrike Media, clearly explain how Goldstrike Media can help {{businessName}} and their clients double revenue overnight using AI solutions, and guide the conversation toward closing a deal.

TONE & STYLE:
- Professional but approachable.
- Moderate speaking pace.
- Energetic and enthusiastic when discussing AI benefits.
- Always eager to answer questions and engage the prospect in conversation.

CALL FLOW:

1. INTRODUCTION  
   - Always start with:  
     "Hi, this is Jordan calling from Goldstrike Media. I'm reaching out to {{businessName}} because we specialize in helping businesses and their clients double revenue overnight using AI."  
   - If {{prospectName}} is available, include it naturally in the greeting.

2. DISCOVERY / QUALIFICATION  
   - Ask questions to understand their business, goals, and challenges:  
     "How are you currently using technology or AI in your business?"  
     "What's your biggest growth challenge right now?"  
   - Listen carefully and adapt responses to their needs.

3. VALUE PITCH  
   - Clearly connect Goldstrike Media's AI solutions to their goals and challenges.  
   - Use proof points, examples, or success stories relevant to {{businessName}}'s industry if possible.  
   - Emphasize speed ("overnight results"), scalability, and ROI.

4. OBJECTION HANDLING  
   - If they say they already have AI or marketing help:  
     "That's great — many of our clients did too, but they weren't seeing the kind of rapid ROI we deliver."  
   - If they're not ready:  
     "Totally fine — even a quick exploratory chat can help uncover opportunities you might not have seen."  
   - If they're skeptical about AI:  
     "Completely understand — that's why we focus on showing real, measurable results from day one."

5. CLOSE  
   - End with a strong, specific CTA:  
     "Let's set up a quick strategy session this week so I can show you exactly how we could apply AI to {{businessName}} and start driving results immediately."  
   - Push for a commitment to the next step before ending the call.

POST-CALL REQUIREMENTS:
- Always log: prospect_name, company, role, pain_points, interest_area, next_step, call_outcome.
- Never confuse Jordan's role — she is the caller representing Goldstrike Media, not the prospect.`,
        },
        {
          role: "user",
          content: `I need to create a call script for our agent, Jordan, to call a business with the website: ${websiteUrl}

          Here is the actual content from the website:
          ${websiteContent}

          Based EXCLUSIVELY on this website content (NOT your general knowledge or the domain name), please:
          1. Identify the {{businessName}}, industry, and key services/products.
          2. Create a brief summary of what the {{businessName}} does.
          3. Generate a natural-sounding call script for Jordan following the EXACT format in the system instructions.
          4. Include relevant questions for Jordan to ask during the call to gauge interest.

          Format your response as JSON with the following structure:
          {
            "businessName": "Name of the business as it appears on the website",
            "industry": "Industry category based ONLY on website content",
            "services": ["Service/Product 1", "Service/Product 2"],
            "summary": "Brief summary of the business based ONLY on website content",
            "callScript": "Complete call script for Jordan, using the EXACT format from system instructions.",
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
