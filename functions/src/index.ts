import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Import routes from functions
import optionsRouter from './routes/options';
import leaderboardRouter from './routes/leaderboard';

// Routes
app.use('/api/options', optionsRouter);
app.use('/api/leaderboard', leaderboardRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);
