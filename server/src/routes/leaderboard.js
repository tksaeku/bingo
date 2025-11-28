'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = __importDefault(require('express'));
const Leaderboard_1 = __importDefault(require('../models/Leaderboard'));
const router = express_1.default.Router();
// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const leaderboard = await Leaderboard_1.default
      .find()
      .sort({ wins: -1, lastWin: -1 })
      .limit(50);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});
// Submit a win
router.post('/', async (req, res) => {
  try {
    const { playerName } = req.body;
    if (!playerName || playerName.trim() === '') {
      return res.status(400).json({ error: 'Player name is required' });
    }
    const existingPlayer = await Leaderboard_1.default.findOne({
      playerName: playerName.trim(),
    });
    if (existingPlayer) {
      existingPlayer.wins += 1;
      existingPlayer.lastWin = new Date();
      await existingPlayer.save();
      res.json(existingPlayer);
    } else {
      const newPlayer = new Leaderboard_1.default({
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
exports.default = router;
