import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaderboard extends Document {
  playerName: string;
  wins: number;
  lastWin: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>({
  playerName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  wins: {
    type: Number,
    default: 1
  },
  lastWin: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<ILeaderboard>('Leaderboard', leaderboardSchema);
