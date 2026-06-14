import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, THEMES, THEME_STORAGE_KEY, applyThemeToRoot } from '../lib/themes.js';

interface ThemeContextValue {
  themeId: string;
  theme: Theme;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) ?? 'default');
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    applyThemeToRoot(theme);
  }, [theme]);

  const setThemeId = (id: string) => {
    localStorage.setItem(THEME_STORAGE_KEY, id);
    setThemeIdState(id);
  };

  return (
    <ThemeContext.Provider value={{ themeId, theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
