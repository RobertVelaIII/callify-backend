"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.websiteAnalysisRoutes = void 0;
const express_1 = __importDefault(require("express"));
const openaiService_1 = require("../services/openaiService");
const router = express_1.default.Router();
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
        const analysis = await (0, openaiService_1.analyzeWebsite)(websiteUrl);
        // Store the analysis in Firestore for later use
        // This will be used when making the call
        return res.status(200).json({
            success: true,
            websiteUrl,
            analysis
        });
    }
    catch (error) {
        console.error('Website analysis error:', error);
        return res.status(500).json({
            error: 'Analysis failed',
            message: error.message || 'Failed to analyze website'
        });
    }
});
exports.websiteAnalysisRoutes = router;
//# sourceMappingURL=websiteAnalysis.js.map