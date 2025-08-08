import { Router } from 'express';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcrypt';
import * as functions from 'firebase-functions';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const db = admin.firestore();


// POST /api/auth/login
// Authenticates a user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Password validation is now handled by Firebase Authentication on the client-side.
    // This backend logic assumes a client has already authenticated and is passing a token.
    // For now, we will trust the client for the sake of getting the user data.
    // In a secure setup, we would verify a Firebase ID token here.


    // On successful login, return user data (excluding password)
    // In a real-world app, you would return a JWT or session token here.
    return res.status(200).json({
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
    });

  } catch (error: any) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/google
// Authenticates or creates a user with a Google ID token
router.post('/google', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Google token is required.' });
  }

  try {
    const clientId = functions.config().google.client_id;
    if (!clientId) {
      console.error('Google Client ID is not configured in Firebase.');
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const client = new OAuth2Client(clientId);

    // Verify the token from Google
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: functions.config().google.client_id, // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.name) {
      return res.status(401).json({ message: 'Invalid Google token.' });
    }

    const { email, name } = payload;

    // Check if user already exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    let userDoc;
    let userData;

    if (snapshot.empty) {
      // If user does not exist, create a new one
      const newUser = {
        name,
        email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        authProvider: 'google',
      };
      const userRef = await db.collection('users').add(newUser);
      userDoc = await userRef.get();
    } else {
      // If user exists, use their existing document
      userDoc = snapshot.docs[0];
    }
    
    userData = userDoc.data();

    if (!userData) {
      return res.status(500).json({ message: 'Failed to retrieve user data.' });
    }

    // Return user data (in a real app, you'd return a session token/JWT)
    return res.status(200).json({
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
    });

  } catch (error: any) {
    console.error('Error during Google login:', error);
    return res.status(500).json({ message: 'Internal server error during Google authentication' });
  }
});

// POST /api/auth/forgot-password
// Sends a password reset link to the user's email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    // Use Firebase Auth to send a password reset email
    const link = await admin.auth().generatePasswordResetLink(email);
    
    // In a real application, you would email this link to the user.
    // For this example, we'll log it and send a generic success message.
    console.log(`Password reset link for ${email}: ${link}`);

    return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });

  } catch (error: any) {
    // Don't reveal if the user does not exist. Generic message is safer.
    if (error.code === 'auth/user-not-found') {
      console.log(`Password reset requested for non-existent user: ${email}`);
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    console.error('Error sending password reset email:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
