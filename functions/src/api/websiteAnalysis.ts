import express from 'express';
import { analyzeWebsite } from '../services/openaiService';

const router = express.Router();

/**
 * POST /website-analysis
 * Analyzes a website URL and generates a call prompt
 */
router.post('/', async (req, res) => {
  try {
    const { websiteUrl } = req.body;
    
    if (!websiteUrl) {
      return res.status(400).json({ 
        error: 'Missing required parameter', 
        message: 'Website URL is required' 
      });
    }
    
    // Analyze the website using OpenAI
    const analysis = await analyzeWebsite(websiteUrl);
    
    // Store the analysis in Firestore for later use
    // This will be used when making the call
    
    return res.status(200).json({
      success: true,
      websiteUrl,
      analysis
    });
  } catch (error: any) {
    console.error('Website analysis error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message || 'Failed to analyze website'
    });
  }
});

export const websiteAnalysisRoutes = router;
