import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, THEMES, THEME_STORAGE_KEY, MODE_STORAGE_KEY, ThemeMode, applyThemeToRoot } from '../lib/themes.js';

interface ThemeContextValue {
  themeId: string;
  theme: Theme;
  setThemeId: (id: string) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) ?? 'default');
  const [mode, setModeState] = useState<ThemeMode>(() => (localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode) ?? 'dark');
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    applyThemeToRoot(theme, mode);
  }, [theme, mode]);

  const setThemeId = (id: string) => {
    localStorage.setItem(THEME_STORAGE_KEY, id);
    setThemeIdState(id);
  };

  const setMode = (m: ThemeMode) => {
    localStorage.setItem(MODE_STORAGE_KEY, m);
    setModeState(m);
  };

  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ themeId, theme, setThemeId, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
