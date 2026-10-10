import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface NavigateOptions {
  replace?: boolean;
  preserveScroll?: boolean;
}

export interface NavigationContextValue {
  currentPath: string;
  currentSearch: string;
  fullPath: string;
  navigate: (to: string, options?: NavigateOptions) => void;
  goBack: (fallbackPath?: string) => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialPathname = () => (typeof window !== 'undefined' ? window.location.pathname || '/' : '/');
  const getInitialSearch = () => (typeof window !== 'undefined' ? window.location.search || '' : '');

  const [currentPath, setCurrentPath] = useState<string>(getInitialPathname);
  const [currentSearch, setCurrentSearch] = useState<string>(getInitialSearch);
  const [historyDepth, setHistoryDepth] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.history.state && typeof window.history.state.appHistoryDepth === 'number') {
      return window.history.state.appHistoryDepth;
    }
    return 0;
  });

  // Ensure current history entry has valid state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingState = window.history.state || {};
    if (typeof existingState.appHistoryDepth !== 'number') {
      const initialUrl = window.location.pathname + window.location.search;
      window.history.replaceState(
        { ...existingState, appHistoryDepth: 0, appUrl: initialUrl },
        '',
        initialUrl
      );
      setHistoryDepth(0);
    } else {
      setHistoryDepth(existingState.appHistoryDepth);
    }

    const handlePopState = (event: PopStateEvent) => {
      const newPath = window.location.pathname || '/';
      const newSearch = window.location.search || '';
      setCurrentPath(newPath);
      setCurrentSearch(newSearch);

      const stateDepth = event.state && typeof event.state.appHistoryDepth === 'number'
        ? event.state.appHistoryDepth
        : 0;
      setHistoryDepth(stateDepth);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options?: NavigateOptions) => {
    if (typeof window === 'undefined') return;

    const targetUrl = to.startsWith('/') ? to : `/${to}`;
    const targetPath = targetUrl.split('?')[0];
    const targetSearch = targetUrl.includes('?') ? `?${targetUrl.split('?')[1]}` : '';

    const currentUrl = window.location.pathname + window.location.search;
    if (targetUrl === currentUrl && !options?.replace) {
      if (!options?.preserveScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (options?.replace) {
      const currentDepth = window.history.state?.appHistoryDepth ?? historyDepth;
      window.history.replaceState(
        { appHistoryDepth: currentDepth, appUrl: targetUrl },
        '',
        targetUrl
      );
    } else {
      const nextDepth = (window.history.state?.appHistoryDepth ?? historyDepth) + 1;
      window.history.pushState(
        { appHistoryDepth: nextDepth, appUrl: targetUrl },
        '',
        targetUrl
      );
      setHistoryDepth(nextDepth);
    }

    setCurrentPath(targetPath);
    setCurrentSearch(targetSearch);

    if (!options?.preserveScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [historyDepth]);

  const goBack = useCallback((fallbackPath?: string) => {
    if (typeof window === 'undefined') return;

    const currentDepth = window.history.state?.appHistoryDepth ?? historyDepth;

    if (typeof currentDepth === 'number' && currentDepth > 0) {
      // Browser back will trigger popstate listener and cleanly transition
      window.history.back();
    } else {
      // Sensible fallback when opened directly via URL or refresh
      const defaultFallback = currentPath.startsWith('/admin') ? '/admin/dashboard' : '/';
      navigate(fallbackPath || defaultFallback);
    }
  }, [historyDepth, currentPath, navigate]);

  const canGoBack = historyDepth > 0;
  const fullPath = currentPath + currentSearch;

  return (
    <NavigationContext.Provider
      value={{
        currentPath,
        currentSearch,
        fullPath,
        navigate,
        goBack,
        canGoBack,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
