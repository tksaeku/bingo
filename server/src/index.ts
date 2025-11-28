import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import optionsRouter from './routes/options';
import leaderboardRouter from './routes/leaderboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo';

// Middleware
app.options('*', cors());  // Enable pre-flight requests for all routes
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/options', optionsRouter);
app.use('/api/leaderboard', leaderboardRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
