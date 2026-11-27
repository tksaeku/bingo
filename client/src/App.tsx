import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import BingoBoard from './components/BingoBoard/BingoBoard';
import Leaderboard from './components/Leaderboard/Leaderboard';
import { useAdminKey } from './hooks/useAdminKey';
import OptionsPage from './pages/OptionsPage/OptionsPage';
import { Brand, Main, NavContent, NavItem, NavLinks, Navbar, Shell } from './App.styles';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './theme';

/** App shell: navigation (admin link only with a verified key) and routes. Needs a Router ancestor. */
const App = (): ReactElement => {
  const { adminKey } = useAdminKey();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Shell>
        <Navbar aria-label="Main">
          <NavContent>
            <Brand to="/">US Open Bingo Game</Brand>
            <NavLinks>
              <NavItem to="/" end>
                Play
              </NavItem>
              {adminKey !== null && <NavItem to="/options">Manage Options</NavItem>}
              <NavItem to="/leaderboard">Leaderboard</NavItem>
            </NavLinks>
          </NavContent>
        </Navbar>

        <Main>
          <Routes>
            <Route path="/" element={<BingoBoard />} />
            <Route path="/options" element={<OptionsPage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Main>
      </Shell>
    </ThemeProvider>
  );
};
App.displayName = 'App';

export default App;
