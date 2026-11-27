export type Option = {
  id: string;
  text: string;
  createdAt: string;
};

export type LeaderboardEntry = {
  id: string;
  playerName: string;
  wins: number;
  lastWin: string;
};
