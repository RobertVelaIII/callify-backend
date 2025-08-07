import * as express from 'express';
import { initiateCall } from '../services/blandService';

const router = express.Router();

router.post('/', async (req: express.Request, res: express.Response) => {
  const { name, phoneNumber, websiteUrl } = req.body;

  if (!name || !phoneNumber || !websiteUrl) {
    return res.status(400).send({ error: 'Name, phone number, and website URL are required' });
  }

  try {
    const callResult = await initiateCall(name, phoneNumber, websiteUrl);
    return res.status(200).send(callResult);
  } catch (error) {
    console.error('Error initiating call:', error);
    return res.status(500).send({ error: 'Failed to initiate call' });
  }
});

export default router;