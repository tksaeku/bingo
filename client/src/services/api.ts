import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Option {
  _id: string;
  text: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  _id: string;
  playerName: string;
  wins: number;
  lastWin: string;
}

export const optionsAPI = {
  getAll: () => api.get<Option[]>('/options'),
  create: (text: string) => api.post<Option>('/options', { text }),
  delete: (id: string) => api.delete(`/options/${id}`),
};

export const leaderboardAPI = {
  getAll: () => api.get<LeaderboardEntry[]>('/leaderboard'),
  submitWin: (playerName: string) => api.post<LeaderboardEntry>('/leaderboard', { playerName }),
};

export default api;
