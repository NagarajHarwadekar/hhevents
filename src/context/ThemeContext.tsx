import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'hh_venue_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Banquet Hall Pro theme is an elegant, warm porcelain & golden light theme
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return 'light';
  });

  const applyTheme = useCallback((mode: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }, []);

  useEffect(() => {
    applyTheme('light');
    try {
      localStorage.setItem(STORAGE_KEY, 'light');
    } catch {}
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    // Keep light theme active per user request
    setThemeState('light');
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState('light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
