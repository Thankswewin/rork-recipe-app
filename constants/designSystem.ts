// Unified Design System for RORK Recipe App
// This replaces scattered styling and provides consistent UI patterns

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 999,
} as const;

export const typography = {
  // Font sizes
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Font weights
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Enhanced color system
export const colorPalette = {
  // Primary colors
  primary: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Main red
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Secondary colors
  secondary: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#FACC15', // Main yellow
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Accent colors
  accent: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main blue
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Purple for AI features
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#8B5CF6', // Main purple
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  
  // Green for success states
  green: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  
  // Neutral grays
  gray: {
    50: '#FAFAFA',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

// Button variants
export const buttonVariants = {
  primary: {
    backgroundColor: colorPalette.purple[500],
    color: '#FFFFFF',
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: colorPalette.gray[100],
    color: colorPalette.gray[900],
    borderColor: colorPalette.gray[200],
  },
  outline: {
    backgroundColor: 'transparent',
    color: colorPalette.purple[500],
    borderColor: colorPalette.purple[500],
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colorPalette.gray[700],
    borderColor: 'transparent',
  },
  success: {
    backgroundColor: colorPalette.green[500],
    color: '#FFFFFF',
    borderColor: 'transparent',
  },
  purple: {
    backgroundColor: colorPalette.purple[500],
    color: '#FFFFFF',
    borderColor: 'transparent',
  },
} as const;

// Button sizes
export const buttonSizes = {
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sm,
    borderRadius: borderRadius.md,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.base,
    borderRadius: borderRadius.lg,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    fontSize: typography.md,
    borderRadius: borderRadius.xl,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
  },
  iconLg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
  },
} as const;

// Input styles
export const inputStyles = {
  base: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.base,
  },
  search: {
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.base,
  },
} as const;

// Card styles
export const cardStyles = {
  base: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  compact: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
} as const;

// Animation durations
export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// Layout constants
export const layout = {
  headerHeight: 60,
  tabBarHeight: 80,
  maxContentWidth: 400,
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type TypographySize = keyof Omit<typeof typography, 'weights' | 'lineHeights'>;
export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;