import express, { Request, Response } from 'express';
import Leaderboard from '../models/Leaderboard';

const router = express.Router();

// Get leaderboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const leaderboard = await Leaderboard.find().sort({ lastWin: -1 }).limit(50);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Submit a win
router.post('/', async (req: Request, res: Response) => {
  try {
    const { playerName } = req.body;

    if (!playerName || playerName.trim() === '') {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const existingPlayer = await Leaderboard.findOne({
      playerName: playerName.trim(),
    });

    if (existingPlayer) {
      existingPlayer.wins += 1;
      existingPlayer.lastWin = new Date();
      await existingPlayer.save();
      res.json(existingPlayer);
    } else {
      const newPlayer = new Leaderboard({
        playerName: playerName.trim(),
        wins: 1,
        lastWin: new Date(),
      });
      await newPlayer.save();
      res.status(201).json(newPlayer);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit win' });
  }
});

export default router;
