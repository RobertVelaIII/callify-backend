import * as express from 'express';
import { sendContactEmail } from '../services/emailService';

const router = express.Router();

router.post('/', async (req: express.Request, res: express.Response) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send({ error: 'Name, email, and message are required' });
  }

  try {
    await sendContactEmail(name, email, message);
    return res.status(200).send({ message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Error sending contact email:', error);
    return res.status(500).send({ error: 'Failed to send contact email' });
  }
});

export default router;