import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { lightColors, darkColors, spacing, radii, typography, fonts, ThemeColors } from './tokens';
import { settingsRepository } from '../../core/database/repositories/settingsRepository';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme_preference';

interface ThemeState {
  themePreference: ThemePreference;
  isInitialized: boolean;
  initializeTheme: () => Promise<void>;
  setThemePreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themePreference: 'light',
  isInitialized: false,
  initializeTheme: async () => {
    const saved = await settingsRepository.get<ThemePreference>(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      set({ themePreference: saved, isInitialized: true });
    } else {
      set({ isInitialized: true });
    }
  },
  setThemePreference: (preference) => {
    set({ themePreference: preference });
    settingsRepository.set(THEME_STORAGE_KEY, preference).catch(() => {});
  },
}));

export function useTheme(): {
  colors: ThemeColors;
  isDark: boolean;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  fonts: typeof fonts;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
} {
  const systemColorScheme = useColorScheme();
  const themePreference = useThemeStore((s) => s.themePreference);
  const setThemePreference = useThemeStore((s) => s.setThemePreference);

  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  return {
    colors,
    isDark,
    spacing,
    radii,
    typography,
    fonts,
    themePreference,
    setThemePreference,
  };
}
