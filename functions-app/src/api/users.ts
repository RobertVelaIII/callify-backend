import { Router } from 'express';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcrypt';

const router = Router();
const db = admin.firestore();
const saltRounds = 10;

// POST /api/users
// Creates a new user in Firestore
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields: name, email, and password.' });
  }

  try {
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Save additional user details in Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({
      name: name,
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      id: userRecord.uid,
      name: name,
      email: email,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    // Handle potential duplicate email errors
    if (error.code === 'ALREADY_EXISTS' || (error.message && error.message.includes('ALREADY_EXISTS'))) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

