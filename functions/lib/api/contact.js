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
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactRoutes = void 0;
const express_1 = __importDefault(require("express"));
const admin = __importStar(require("firebase-admin"));
const emailService_1 = require("../services/emailService");
const router = express_1.default.Router();
const db = admin.firestore();
/**
 * POST /contact
 * Handles contact form submissions
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                error: 'Missing required parameters',
                message: 'Name, email, and message are required'
            });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email',
                message: 'Please provide a valid email address'
            });
        }
        // Store submission in Firestore
        const submissionRef = await db.collection('contactSubmissions').add({
            name,
            email,
            message,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
            status: 'pending'
        });
        // Send email notification
        await (0, emailService_1.sendEmail)({
            to: 'your-designated-email@example.com',
            subject: 'New Contact Form Submission - Callify',
            text: `
        New contact form submission from ${name} (${email}):
        
        ${message}
        
        Submitted on: ${new Date().toLocaleString()}
      `,
            html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p><em>Submitted on: ${new Date().toLocaleString()}</em></p>
      `
        });
        // Update submission status
        await submissionRef.update({
            status: 'sent'
        });
        return res.status(200).json({
            success: true,
            message: 'Contact form submitted successfully',
            submissionId: submissionRef.id
        });
    }
    catch (error) {
        console.error('Contact form submission error:', error);
        return res.status(500).json({
            error: 'Submission failed',
            message: error.message || 'Failed to submit contact form'
        });
    }
});
exports.contactRoutes = router;
//# sourceMappingURL=contact.js.map