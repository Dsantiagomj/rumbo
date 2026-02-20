/**
 * Design tokens matching the web app's shadcn neutral theme.
 * OKLCH values from apps/web/src/app/styles/globals.css converted to hex.
 */

export const colors = {
  light: {
    background: '#ffffff',
    foreground: '#0a0a0a',
    card: '#ffffff',
    cardForeground: '#0a0a0a',
    primary: '#171717',
    primaryForeground: '#fafafa',
    secondary: '#f5f5f5',
    secondaryForeground: '#171717',
    muted: '#f5f5f5',
    mutedForeground: '#737373',
    accent: '#f5f5f5',
    accentForeground: '#171717',
    destructive: '#ef4444',
    border: '#e5e5e5',
    input: '#e5e5e5',
    ring: '#a3a3a3',
  },
  dark: {
    background: '#0a0a0a',
    foreground: '#fafafa',
    card: '#171717',
    cardForeground: '#fafafa',
    primary: '#d4d4d4',
    primaryForeground: '#171717',
    secondary: '#262626',
    secondaryForeground: '#fafafa',
    muted: '#262626',
    mutedForeground: '#a3a3a3',
    accent: '#404040',
    accentForeground: '#fafafa',
    destructive: '#dc2626',
    border: '#262626',
    input: '#333333',
    ring: '#737373',
  },
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
} as const;

export const fontFamily = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
} as const;
