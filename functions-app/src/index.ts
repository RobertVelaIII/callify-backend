import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin SDK *once*
admin.initializeApp();

// Import API route handlers and middleware
import websiteAnalysisRouter from "./api/websiteAnalysis";
import callRouter from "./api/call";
import contactRouter from "./api/contact";
import { rateLimit } from "./utils/rateLimit";

// Create and configure the Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting middleware specifically to the /call endpoint
app.use("/call", rateLimit);

// Define API routes
app.use("/api/website-analysis", websiteAnalysisRouter);
app.use("/api/call", callRouter);
app.use("/api/contact", contactRouter);

// Expose the Express app as a single Cloud Function
export const api = onRequest({ invoker: "public" }, app);
