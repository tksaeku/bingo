import { useState } from 'react';
import './WinModal.scss';

interface WinModalProps {
  onClose: () => void;
  onPlayAgain: (playerName: string) => void;
}

const WinModal = ({ onClose, onPlayAgain }: WinModalProps) => {
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      setSubmitted(true);
      onPlayAgain(playerName);
    }
  };

  return (
    <div className="win-modal-overlay">
      <div className="win-modal">
        <div className="confetti">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
            }} />
          ))}
        </div>
        
        <h1 className="win-title">🎉 BINGO! 🎉</h1>
        <p className="win-message">Congratulations! You won!</p>
        
        {!submitted ? (
          <form onSubmit={handleSubmit} className="win-form">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="player-input"
              autoFocus
              maxLength={20}
            />
            <div className="button-group">
              <button type="submit" className="btn btn-primary">
                Submit & Play Again
              </button>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Close
              </button>
            </div>
          </form>
        ) : (
          <div className="submitted-message">
            <p>Score submitted! Good luck, {playerName}!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WinModal;
