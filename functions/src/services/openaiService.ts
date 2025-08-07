import axios from 'axios';
import OpenAI from 'openai';
import * as functions from 'firebase-functions';

// Initialize OpenAI client using Firebase Functions config
const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
});

/**
 * Scrapes content from a website URL
 * @param url The website URL to scrape
 * @returns The scraped content
 */
async function scrapeWebsite(url: string): Promise<string> {
  try {
    // Simple website scraping using axios
    const response = await axios.get(url);
    
    // Extract text content from HTML
    // This is a simplified version - in production, use a proper HTML parser
    let content = response.data;
    
    // Remove HTML tags (simplified approach)
    content = content.replace(/<[^>]*>/g, ' ');
    
    // Remove extra whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    // Limit content length to avoid token limits
    return content.substring(0, 5000);
  } catch (error) {
    console.error('Website scraping error:', error);
    throw new Error('Failed to scrape website content');
  }
}

/**
 * Analyzes a website and generates a call prompt using OpenAI
 * @param websiteUrl The URL of the website to analyze
 * @returns Analysis and call prompt
 */
export async function analyzeWebsite(websiteUrl: string): Promise<any> {
  try {
    // Scrape website content
    const websiteContent = await scrapeWebsite(websiteUrl);
    
    // Generate analysis using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that analyzes business websites and creates effective call scripts for sales representatives. 
          Your task is to analyze the website content provided and create a natural-sounding call script that a sales representative could use.
          The script should be friendly, professional, and tailored to the specific business.`
        },
        {
          role: 'user',
          content: `Here is the content from a business website: ${websiteContent}
          
          Based on this content, please:
          1. Identify the business name, industry, and key services/products
          2. Create a brief summary of what the business does
          3. Generate a natural-sounding call script that a sales representative could use when calling this business
          4. Include 2-3 questions that would be relevant to ask during the call
          
          Format your response as JSON with the following structure:
          {
            "businessName": "Name of the business",
            "industry": "Industry category",
            "services": ["Service 1", "Service 2"],
            "summary": "Brief summary of the business",
            "callScript": "Complete call script",
            "questions": ["Question 1", "Question 2"]
          }`
        }
      ],
      response_format: { type: 'json_object' }
    });
    
    // Parse the response
    const analysisText = completion.choices[0].message.content || '{}';
    const analysis = JSON.parse(analysisText);
    
    return analysis;
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw new Error('Failed to analyze website with OpenAI');
  }
}
