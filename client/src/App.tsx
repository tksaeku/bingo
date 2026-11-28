import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import BingoBoard from './components/BingoBoard/BingoBoard';
import Leaderboard from './components/Leaderboard/Leaderboard';
import { usePageViewTracking } from './hooks/usePageViewTracking';
import CardsPage from './pages/CardsPage/CardsPage';
import PasskeysPage from './pages/PasskeysPage/PasskeysPage';
import StatsPage from './pages/StatsPage/StatsPage';
import { trackEvent } from './services/analytics';
import { THE_OPEN_WEBSITE_URL } from './constants';
import {
  Brand,
  BrandTagline,
  ExternalLink,
  Footer,
  FooterLink,
  Header,
  HeaderContent,
  Main,
  NavItem,
  NavLinks,
  Shell,
  Wordmark,
  WordmarkGlyph,
} from './App.styles';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './theme';

/** App shell: header navigation, footer and routes. The admin pages have no nav links: they are reached at /cards, /stats and /passkeys, all behind the admin unlock screen. Needs a Router ancestor. */
const App = (): ReactElement => {
  usePageViewTracking();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Shell>
        <Header>
          <HeaderContent>
            <Brand to="/" aria-label="The Open Bingo home">
              <Wordmark>
                <WordmarkGlyph aria-hidden="true">✦</WordmarkGlyph>
                The Open
              </Wordmark>
              <BrandTagline>
                World Swing Dance
                <br />
                Championships
              </BrandTagline>
            </Brand>
            <NavLinks aria-label="Main">
              <ExternalLink
                href={THE_OPEN_WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent({ name: 'outbound_click', properties: { placement: 'header' } })}
              >
                Visit The Open website
              </ExternalLink>
              <NavItem to="/" end>
                Play
              </NavItem>
              <NavItem to="/leaderboard">Leaderboard</NavItem>
            </NavLinks>
          </HeaderContent>
        </Header>

        <Main>
          <Routes>
            <Route path="/" element={<BingoBoard />} />
            <Route path="/cards" element={<CardsPage />} />
            <Route path="/options" element={<Navigate to="/cards" replace />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/passkeys" element={<PasskeysPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Main>

        <Footer>
          <span>The Open · World Swing Dance Championships · Made for the moments we share</span>
          <FooterLink
            href={THE_OPEN_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent({ name: 'outbound_click', properties: { placement: 'footer' } })}
          >
            Visit The Open website
          </FooterLink>
        </Footer>
      </Shell>
    </ThemeProvider>
  );
};
App.displayName = 'App';

export default App;
