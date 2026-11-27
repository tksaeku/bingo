import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../services/analytics';
import type { AnalyticsRoute } from '../types';

/** Tracked routes by pathname; every other path (the stats page, redirecting unknown paths) is skipped. */
const ROUTE_BY_PATHNAME: Readonly<Record<string, AnalyticsRoute>> = {
  '/': 'play',
  '/leaderboard': 'leaderboard',
  '/cards': 'options',
};

/** Tracks a `page_view` each time the router lands on a tracked route; repeats of the same path are ignored. Needs a Router ancestor. */
export function usePageViewTracking(): void {
  const { pathname } = useLocation();
  const lastTrackedPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const route = ROUTE_BY_PATHNAME[pathname];
    if (route === undefined || lastTrackedPathnameRef.current === pathname) {
      return;
    }
    lastTrackedPathnameRef.current = pathname;
    trackEvent({ name: 'page_view', properties: { route } });
  }, [pathname]);
}
