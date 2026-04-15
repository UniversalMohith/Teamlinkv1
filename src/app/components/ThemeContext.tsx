import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// In-memory persistence (localStorage blocked in sandboxed iframes)
let _persistedTheme: Theme = 'auto';
let _persistedAccent: AccentColor = 'blue';

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveIsDark(theme: Theme): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return getSystemDark();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, _setTheme] = useState<Theme>(_persistedTheme);
  const [accentColor, _setAccentColor] = useState<AccentColor>(_persistedAccent);
  const [isDark, setIsDark] = useState(() => resolveIsDark(_persistedTheme));
  const themeRef = useRef(theme);

  // Listen for system preference changes when in 'auto' mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (themeRef.current === 'auto') {
        const dark = e.matches;
        setIsDark(dark);
        const root = document.documentElement;
        if (dark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = (newTheme: Theme) => {
    _persistedTheme = newTheme;
    themeRef.current = newTheme;
    _setTheme(newTheme);
    const dark = resolveIsDark(newTheme);
    setIsDark(dark);
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const setAccentColor = (color: AccentColor) => {
    _persistedAccent = color;
    _setAccentColor(color);
  };

  // Apply accent color CSS variables whenever theme or accent changes
  useEffect(() => {
    const root = document.documentElement;

    // Sync dark class on mount and theme change
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const accentColors = {
      blue: {
        primary: '37 99 235',
        primaryHover: '29 78 216',
        light: '219 234 254',
        primaryDark: '34 211 238',
        primaryDarkHover: '103 232 249',
        lightDark: '22 78 99',
      },
      purple: {
        primary: '147 51 234',
        primaryHover: '126 34 206',
        light: '243 232 255',
        primaryDark: '232 121 249',
        primaryDarkHover: '240 171 252',
        lightDark: '112 26 117',
      },
      green: {
        primary: '22 163 74',
        primaryHover: '21 128 61',
        light: '220 252 231',
        primaryDark: '163 230 53',
        primaryDarkHover: '190 242 100',
        lightDark: '54 83 20',
      },
      orange: {
        primary: '234 88 12',
        primaryHover: '194 65 12',
        light: '254 243 199',
        primaryDark: '251 191 36',
        primaryDarkHover: '252 211 77',
        lightDark: '120 53 15',
      },
      pink: {
        primary: '219 39 119',
        primaryHover: '190 24 93',
        light: '252 231 243',
        primaryDark: '251 113 133',
        primaryDarkHover: '253 164 175',
        lightDark: '136 19 55',
      },
    };

    const colors = accentColors[accentColor];
    root.style.setProperty('--color-accent-primary', colors.primary);
    root.style.setProperty('--color-accent-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-accent-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-accent-primary-dark-hover', colors.primaryDarkHover);
    root.style.setProperty('--color-accent-light', colors.light);
    root.style.setProperty('--color-accent-light-dark', colors.lightDark);
  }, [theme, accentColor, isDark]);

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
