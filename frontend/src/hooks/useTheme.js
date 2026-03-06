import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'rahify-theme';

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme) {
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

export function useTheme() {
  const [theme, setTheme] = useState(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle, isDark: theme === 'dark' };
}
