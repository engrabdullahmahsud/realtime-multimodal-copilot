import { useState, useEffect } from 'react';

// Types
export interface ThemeContextType {
  themeMode: 'light' | 'dark';
  isDark: boolean;
  toggleTheme: () => void;
}

// Theme hook
export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeContextType['themeMode']>('light');

  // Initialize from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setThemeMode(savedTheme as ThemeContextType['themeMode']);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode(prev => prev === 'light' ? 'dark' : 'light');

  return {
    themeMode,
    isDark: themeMode === 'dark',
    toggleTheme
  };
}