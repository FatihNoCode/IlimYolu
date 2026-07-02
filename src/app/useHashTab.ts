import { useState, useEffect } from 'react';

/**
 * Syncs a dashboard tab with the URL hash (e.g. #tab=teachers) so each tab is
 * a real browser history entry. The browser back/forward buttons then navigate
 * between tabs instead of leaving the app, and reloading keeps the same tab.
 */
export function useHashTab<T extends string>(
  defaultTab: T,
  validTabs: readonly T[],
): [T, (tab: T) => void] {
  const readHash = (): T => {
    const match = window.location.hash.match(/tab=([^&]+)/);
    const value = match ? (decodeURIComponent(match[1]) as T) : defaultTab;
    return validTabs.includes(value) ? value : defaultTab;
  };

  const [tab, setTabState] = useState<T>(readHash);

  useEffect(() => {
    const onPop = () => setTabState(readHash());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTab = (next: T) => {
    setTabState(next);
    const hash = `#tab=${next}`;
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash);
    }
  };

  return [tab, setTab];
}
