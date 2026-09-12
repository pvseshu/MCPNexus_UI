import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 
  | 'enterprise-indigo' // Default clean corporate light
  | 'cyber-obsidian'    // Dark futuristic terminal with neon cyan & emerald
  | 'nordic-frost'      // Arctic cool slate & glacier teal
  | 'synthwave-neon'    // Dark midnight violet & electric magenta
  | 'luxury-amber';     // Editorial warm cream, copper & espresso

export interface ThemeOption {
  id: AppTheme;
  name: string;
  category: 'Light' | 'Dark';
  description: string;
  palette: {
    bg: string;
    card: string;
    primary: string;
    accent: string;
    text: string;
  };
  accentLabel: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'enterprise-indigo',
    name: 'Enterprise Indigo',
    category: 'Light',
    description: 'Clean, crisp modern enterprise SaaS layout with high-contrast indigo and slate accents.',
    palette: {
      bg: '#f8fafc',
      card: '#ffffff',
      primary: '#4f46e5',
      accent: '#6366f1',
      text: '#0f172a',
    },
    accentLabel: 'Modern SaaS',
  },
  {
    id: 'cyber-obsidian',
    name: 'Cyber Obsidian Terminal',
    category: 'Dark',
    description: 'Deep OLED obsidian canvas with glowing neon cyan/emerald badges, dark glass, and cyber command styling.',
    palette: {
      bg: '#080c14',
      card: '#0e1526',
      primary: '#06b6d4',
      accent: '#10b981',
      text: '#f1f5f9',
    },
    accentLabel: 'Dark Cyber Matrix',
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost Glacier',
    category: 'Light',
    description: 'Crisp Scandinavian cool slate with arctic glacier teal, ice borders, and balanced airy spacing.',
    palette: {
      bg: '#f0f5fa',
      card: '#ffffff',
      primary: '#0d9488',
      accent: '#0284c7',
      text: '#0f2937',
    },
    accentLabel: 'Arctic Teal',
  },
  {
    id: 'synthwave-neon',
    name: 'Tokyo Synthwave',
    category: 'Dark',
    description: 'Deep night violet canvas with ultraviolet glow, electric magenta highlights, and neon gradients.',
    palette: {
      bg: '#0c0817',
      card: '#16102b',
      primary: '#d946ef',
      accent: '#8b5cf6',
      text: '#fdf4ff',
    },
    accentLabel: 'Neon Ultraviolet',
  },
  {
    id: 'luxury-amber',
    name: 'Warm Copper & Espresso',
    category: 'Light',
    description: 'Warm cashmere paper aesthetic with rich bronze copper, dark espresso typography, and refined luxury finish.',
    palette: {
      bg: '#faf6f0',
      card: '#ffffff',
      primary: '#c2410c',
      accent: '#d97706',
      text: '#29180c',
    },
    accentLabel: 'Warm Editorial',
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  currentThemeOption: ThemeOption;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('mcp_nexus_theme') as AppTheme;
      if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {}
    return 'enterprise-indigo';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('mcp_nexus_theme', newTheme);
    } catch {}
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const isDarkMode = theme === 'cyber-obsidian' || theme === 'synthwave-neon';
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const currentThemeOption = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];
  const isDark = theme === 'cyber-obsidian' || theme === 'synthwave-neon';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentThemeOption, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
