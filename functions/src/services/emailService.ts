import * as nodemailer from 'nodemailer';

// Email configuration
// In production, use environment variables for these values
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@example.com',
    pass: process.env.EMAIL_PASSWORD || 'your-email-password'
  },
  from: process.env.EMAIL_FROM || 'Callify <noreply@callify.example.com>'
};

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_CONFIG.host,
  port: EMAIL_CONFIG.port,
  secure: EMAIL_CONFIG.secure,
  auth: EMAIL_CONFIG.auth
});

/**
 * Interface for email options
 */
interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
}

/**
 * Sends an email using Nodemailer
 * @param options Email options including recipient, subject, and content
 * @returns Information about the sent email
 */
export async function sendEmail(options: EmailOptions): Promise<any> {
  try {
    const mailOptions = {
      from: options.from || EMAIL_CONFIG.from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
      attachments: options.attachments
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    return {
      messageId: info.messageId,
      success: true
    };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
}
