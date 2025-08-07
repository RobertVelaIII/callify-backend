import express from 'express';
import * as admin from 'firebase-admin';
import { sendEmail } from '../services/emailService';

const router = express.Router();
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
    await sendEmail({
      to: 'your-designated-email@example.com', // Replace with your actual email
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
  } catch (error: any) {
    console.error('Contact form submission error:', error);
    return res.status(500).json({
      error: 'Submission failed',
      message: error.message || 'Failed to submit contact form'
    });
  }
});

export const contactRoutes = router;
