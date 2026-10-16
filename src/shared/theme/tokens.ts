/**
 * Design Tokens
 *
 * Implements a restrained, warm visual identity:
 * - Ivory / off-white warm surfaces
 * - Charcoal text
 * - Tasteful terracotta and sage green accents
 * - Full light and dark theme token mappings
 */

export const lightColors = {
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceRaised: '#F5EFE6',
  surfaceSubtle: '#EFE9DF',
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#8C857B',
  border: '#E8E2D8',
  borderLight: '#F0EAE0',
  accent: '#C25E3E', // Tasteful terracotta
  accentHover: '#A94F33',
  accentSubtle: '#FBEFEA',
  success: '#2D6A4F', // Tasteful sage/forest green
  successSubtle: '#EAF4EE',
  warning: '#D97706',
  warningSubtle: '#FEF3C7',
  danger: '#DC2626',
  dangerSubtle: '#FEE2E2',
  info: '#2563EB',
  infoSubtle: '#EFF6FF',

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E8E2D8',
  tabBarActive: '#C25E3E',
  tabBarInactive: '#8C857B',

  // Priorities
  priorityUrgent: '#DC2626',
  priorityHigh: '#E07A5F',
  priorityMedium: '#2D6A4F',
  priorityLow: '#6B7280',
};

export const darkColors: typeof lightColors = {
  background: '#121517',
  surface: '#1C2125',
  surfaceRaised: '#262C32',
  surfaceSubtle: '#1E2429',
  textPrimary: '#F3F4F6',
  textSecondary: '#D1D5DB',
  textMuted: '#8E959E',
  border: '#2F3841',
  borderLight: '#232B32',
  accent: '#E07A5F', // Slightly brighter terracotta for dark mode
  accentHover: '#F48C6A',
  accentSubtle: '#33221C',
  success: '#40916C',
  successSubtle: '#182C22',
  warning: '#F59E0B',
  warningSubtle: '#382910',
  danger: '#EF4444',
  dangerSubtle: '#3B1A1A',
  info: '#3B82F6',
  infoSubtle: '#172554',

  tabBarBackground: '#1C2125',
  tabBarBorder: '#2F3841',
  tabBarActive: '#E07A5F',
  tabBarInactive: '#8E959E',

  priorityUrgent: '#EF4444',
  priorityHigh: '#F97316',
  priorityMedium: '#40916C',
  priorityLow: '#9CA3AF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fonts = {
  regular: 'Vazirmatn-Regular',
  medium: 'Vazirmatn-Medium',
  semiBold: 'Vazirmatn-SemiBold',
  bold: 'Vazirmatn-Bold',
  light: 'Vazirmatn-Light',
} as const;

export const typography = {
  titleLarge: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '700' as const,
    writingDirection: 'rtl' as const,
    includeFontPadding: false,
  },
  titleMedium: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '700' as const,
    writingDirection: 'rtl' as const,
    includeFontPadding: false,
  },
  titleSmall: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600' as const,
    writingDirection: 'rtl' as const,
    includeFontPadding: false,
  },
  bodyLarge: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400' as const,
    writingDirection: 'rtl' as const,
    includeFontPadding: false,
  },
  bodyMedium: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400' as const,
    writingDirection: 'rtl' as const,
    includeFontPadding: false,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '400' as const,
    writingDirection: 'rtl' as const,
    includeFontPadding: false,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '500' as const,
    writingDirection: 'rtl' as const,
    includeFontPadding: false,
  },
} as const;

export type ThemeColors = typeof lightColors;
