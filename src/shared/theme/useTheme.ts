import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { lightColors, darkColors, spacing, radii, typography, fonts, ThemeColors } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themePreference: 'light',
  setThemePreference: (preference) => set({ themePreference: preference }),
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
