import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    if (theme === 'dark') {
      root.classList.add('dark');
      setIsDark(true);
    } else if (theme === 'light') {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      // Auto mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        setIsDark(true);
      } else {
        root.classList.remove('dark');
        setIsDark(false);
      }
    }

    // Apply accent color CSS variables
    // Light mode uses professional, standard colors
    // Dark mode uses completely different colors optimized for dark backgrounds
    const accentColors = {
      blue: {
        // Light mode - professional blue
        primary: '37 99 235', // blue-600
        primaryHover: '29 78 216', // blue-700
        light: '219 234 254', // blue-100
        // Dark mode - bright cyan (completely different!)
        primaryDark: '34 211 238', // cyan-400 - electric cyan
        primaryDarkHover: '103 232 249', // cyan-300
        lightDark: '22 78 99', // cyan-900
      },
      purple: {
        // Light mode - standard purple
        primary: '147 51 234', // purple-600
        primaryHover: '126 34 206', // purple-700
        light: '243 232 255', // purple-100
        // Dark mode - vibrant magenta
        primaryDark: '232 121 249', // fuchsia-400 - bright magenta
        primaryDarkHover: '240 171 252', // fuchsia-300
        lightDark: '112 26 117', // fuchsia-900
      },
      green: {
        // Light mode - standard green
        primary: '22 163 74', // green-600
        primaryHover: '21 128 61', // green-700
        light: '220 252 231', // green-100
        // Dark mode - lime/chartreuse
        primaryDark: '163 230 53', // lime-400 - neon lime
        primaryDarkHover: '190 242 100', // lime-300
        lightDark: '54 83 20', // lime-900
      },
      orange: {
        // Light mode - standard orange
        primary: '234 88 12', // orange-600
        primaryHover: '194 65 12', // orange-700
        light: '254 243 199', // orange-100
        // Dark mode - amber/gold
        primaryDark: '251 191 36', // amber-400 - rich gold
        primaryDarkHover: '252 211 77', // amber-300
        lightDark: '120 53 15', // amber-900
      },
      pink: {
        // Light mode - standard pink
        primary: '219 39 119', // pink-600
        primaryHover: '190 24 93', // pink-700
        light: '252 231 243', // pink-100
        // Dark mode - rose/coral
        primaryDark: '251 113 133', // rose-400 - coral pink
        primaryDarkHover: '253 164 175', // rose-300
        lightDark: '136 19 55', // rose-900
      },
    };

    const colors = accentColors[accentColor];
    root.style.setProperty('--color-accent-primary', colors.primary);
    root.style.setProperty('--color-accent-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-accent-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-accent-primary-dark-hover', colors.primaryDarkHover);
    root.style.setProperty('--color-accent-light', colors.light);
    root.style.setProperty('--color-accent-light-dark', colors.lightDark);
  }, [theme, accentColor]);

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