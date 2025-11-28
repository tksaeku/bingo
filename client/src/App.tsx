import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BingoBoard from './components/BingoBoard';
import OptionsManager from './components/OptionsManager';
import Leaderboard from './components/Leaderboard';
import './App.scss';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-content">
            <Link to="/" className="nav-brand">US Open Bingo Game</Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Play</Link>
              {/* <Link to="/options" className="nav-link">Manage Options</Link> */}
              <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<BingoBoard />} />
            <Route path="/options" element={<OptionsManager />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
