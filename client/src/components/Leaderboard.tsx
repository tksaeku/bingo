import { useState, useEffect } from 'react';
import { leaderboardAPI } from '../services/api';
import type { LeaderboardEntry } from '../services/api';
import './Leaderboard.scss';

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await leaderboardAPI.getAll();
      setEntries(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="leaderboard loading">Loading leaderboard...</div>;
  }

  return (
    <div className="leaderboard">
      <h1>🏆 Leaderboard</h1>
      
      {error && <p className="error-message">{error}</p>}

      {entries.length === 0 ? (
        <p className="empty-message">No winners yet. Be the first!</p>
      ) : (
        <div className="leaderboard-table">
          <div className="table-header">
            <div className="rank-col">Rank</div>
            <div className="name-col">Player</div>
            <div className="wins-col">Wins</div>
          </div>
          {entries.map((entry, index) => (
            <div key={entry._id} className={`table-row ${index < 3 ? 'top-three' : ''}`}>
              <div className="rank-col">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </div>
              <div className="name-col">{entry.playerName}</div>
              <div className="wins-col">{entry.wins}</div>
            </div>
          ))}
        </div>
      )}
      
      <button onClick={fetchLeaderboard} className="btn btn-secondary refresh-btn">
        Refresh
      </button>
    </div>
  );
};

export default Leaderboard;
