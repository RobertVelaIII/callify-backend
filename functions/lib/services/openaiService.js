"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeWebsite = void 0;
const axios_1 = __importDefault(require("axios"));
const openai_1 = __importDefault(require("openai"));
const functions = __importStar(require("firebase-functions"));
// Initialize OpenAI client using Firebase Functions config
const openai = new openai_1.default({
    apiKey: ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.OPENAI_API_KEY,
});
/**
 * Scrapes content from a website URL
 * @param url The website URL to scrape
 * @returns The scraped content
 */
async function scrapeWebsite(url) {
    try {
        // Simple website scraping using axios
        const response = await axios_1.default.get(url);
        // Extract text content from HTML
        // This is a simplified version - in production, use a proper HTML parser
        let content = response.data;
        // Remove HTML tags (simplified approach)
        content = content.replace(/<[^>]*>/g, ' ');
        // Remove extra whitespace
        content = content.replace(/\s+/g, ' ').trim();
        // Limit content length to avoid token limits
        return content.substring(0, 5000);
    }
    catch (error) {
        console.error('Website scraping error:', error);
        throw new Error('Failed to scrape website content');
    }
}
/**
 * Analyzes a website and generates a call prompt using OpenAI
 * @param websiteUrl The URL of the website to analyze
 * @returns Analysis and call prompt
 */
async function analyzeWebsite(websiteUrl) {
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
    }
    catch (error) {
        console.error('OpenAI analysis error:', error);
        throw new Error('Failed to analyze website with OpenAI');
    }
}
exports.analyzeWebsite = analyzeWebsite;
//# sourceMappingURL=openaiService.js.map