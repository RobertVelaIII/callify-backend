
import * as nodemailer from 'nodemailer';

/**
 * Sends a contact form email.
 * @param {string} name The sender's name.
 * @param {string} email The sender's email.
 * @param {string} message The message content.
 */
export const sendContactEmail = async (name: string, email: string, message: string) => {
  // Access environment variables using process.env
  const host = process.env.NODEMAILER_HOST;
  const port = process.env.NODEMAILER_PORT;
  const secure = process.env.NODEMAILER_SECURE;
  const user = process.env.NODEMAILER_USER;
  const pass = process.env.NODEMAILER_PASS;

  if (!host || !port || !secure || !user || !pass) {
    console.error('Nodemailer environment variables are not fully set.');
    throw new Error('Server configuration error for sending email.');
  }

  const mailTransport = nodemailer.createTransport({
    host: host,
    port: parseInt(port, 10),
    secure: secure === 'true',
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"Callify Contact Form" <${user}>`,
    to: user, // Sending to your own email
    subject: `New contact message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
  };

  try {
    await mailTransport.sendMail(mailOptions);
    console.log('Contact email sent successfully.');
  } catch (error) {
    console.error('There was an error while sending the contact email:', error);
    throw new Error('Failed to send contact email.');
  }
};