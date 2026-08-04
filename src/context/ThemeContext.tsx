import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { ThemeItem } from '../types';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
  applyCustomTheme: (activeTheme: ThemeItem) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  isDark: true,
  applyCustomTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('virjoy_theme') as ThemeMode;
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark';
  });

  const [isDark, setIsDark] = useState<boolean>(true);

  const applyCustomTheme = useCallback((activeTheme: ThemeItem) => {
    if (!activeTheme) return;
    const root = document.documentElement;
    root.style.setProperty('--vj-primary', activeTheme.primaryColor);
    root.style.setProperty('--vj-secondary', activeTheme.secondaryColor);
    root.style.setProperty('--vj-accent', activeTheme.accentColor);
    root.style.setProperty('--vj-bg', activeTheme.backgroundColor);
    root.style.setProperty('--vj-card', activeTheme.cardColor);
    root.style.setProperty('--vj-button', activeTheme.buttonColor);
    root.style.setProperty('--vj-border', activeTheme.borderColor);
    root.style.setProperty('--vj-text', activeTheme.textColor);
  }, []);

  useEffect(() => {
    localStorage.setItem('virjoy_theme', theme);
    const root = document.documentElement;

    const updateTheme = () => {
      let computedIsDark = true;
      if (theme === 'system') {
        computedIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        computedIsDark = theme === 'dark';
      }

      setIsDark(computedIsDark);

      if (computedIsDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    updateTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const value = useMemo(() => ({
    theme,
    setTheme,
    isDark,
    applyCustomTheme
  }), [theme, setTheme, isDark, applyCustomTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


