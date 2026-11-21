import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeId = 'esmeralda' | 'bosque' | 'cacao' | 'pacifico' | 'atardecer';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  swatches: [string, string, string];
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'esmeralda',
    label: 'Esmeralda Original',
    labelEn: 'Original Emerald',
    description: 'La identidad clásica de AgroBarú.',
    descriptionEn: 'The classic AgroBarú identity.',
    swatches: ['#090D0B', '#15803D', '#10B981'],
  },
  {
    id: 'bosque',
    label: 'Bosque Profundo',
    labelEn: 'Deep Forest',
    description: 'Verde más denso para trabajo nocturno.',
    descriptionEn: 'Denser green for night work.',
    swatches: ['#050B08', '#14532D', '#34D399'],
  },
  {
    id: 'cacao',
    label: 'Cacao Cálido',
    labelEn: 'Warm Cocoa',
    description: 'Tonos tierra inspirados en el cacao criollo.',
    descriptionEn: 'Earth tones inspired by Criollo cocoa.',
    swatches: ['#0D0906', '#78350F', '#FACC15'],
  },
  {
    id: 'pacifico',
    label: 'Pacífico Nocturno',
    labelEn: 'Night Pacific',
    description: 'Azul profundo del Pacífico chiricano.',
    descriptionEn: 'Deep blue from the Chiriquí Pacific.',
    swatches: ['#050B10', '#0C4A6E', '#38BDF8'],
  },
  {
    id: 'atardecer',
    label: 'Atardecer de Barú',
    labelEn: 'Barú Sunset',
    description: 'Cálido, con acentos dorados y violeta.',
    descriptionEn: 'Warm, with gold and violet accents.',
    swatches: ['#0C080D', '#6D28D9', '#FACC15'],
  },
];

const STORAGE_KEY = 'agrobaru_theme';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function loadStoredTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES.some((item) => item.id === saved)) return saved;
  } catch {
    // Se usa el tema original.
  }
  return 'esmeralda';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(loadStoredTheme);

  const setTheme = (next: ThemeId) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // La preferencia sigue activa durante esta sesión.
    }
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
