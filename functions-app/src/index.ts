// Forcing redeployment with App Password at 2025-08-07T02:32:58-05:00
import {onRequest} from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';

import websiteAnalysisRouter from './api/websiteAnalysis';
import callRouter from './api/call';
import contactRouter from './api/contact';
import { rateLimit } from './utils/rateLimit';

admin.initializeApp();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to the call endpoint
app.use('/call', rateLimit);

// API routes
app.use('/website-analysis', websiteAnalysisRouter);
app.use('/call', callRouter);
app.use('/contact', contactRouter);

// Expose the Express app as a Cloud Function
export const api = onRequest({ invoker: 'public' }, app);