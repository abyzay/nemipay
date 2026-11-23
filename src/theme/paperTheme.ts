import { MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { getColors, lightColors, type ThemeMode } from './colors';
import { radii } from './radii';
import { paperFonts } from './typography';

export function buildPaperTheme(mode: ThemeMode = 'light'): MD3Theme {
  const palette = getColors(mode);

  return {
    ...MD3LightTheme,
    dark: false,
    roundness: radii.md,
    fonts: paperFonts,
    colors: {
      ...MD3LightTheme.colors,
      primary: palette.primary,
      onPrimary: palette.onPrimary,
      primaryContainer: palette.secondary,
      onPrimaryContainer: palette.primaryDark,
      secondary: palette.secondary,
      onSecondary: palette.onSecondary,
      secondaryContainer: palette.secondary,
      onSecondaryContainer: palette.primaryDark,
      background: palette.background,
      onBackground: palette.textPrimary,
      surface: palette.surface,
      onSurface: palette.onSurface,
      surfaceVariant: palette.background,
      onSurfaceVariant: palette.textSecondary,
      outline: palette.border,
      outlineVariant: palette.border,
      error: palette.error,
      onError: '#FFFFFF',
      surfaceDisabled: '#EFF3F1',
      onSurfaceDisabled: palette.disabled,
    },
  };
}

export const nemipayLightTheme: MD3Theme = buildPaperTheme('light');

/**
 * Selector de tema preparado para soportar tema oscuro cuando se definan tokens dark.
 */
export function getPaperTheme(mode: ThemeMode = 'light'): MD3Theme {
  if (mode === 'dark') {
    return nemipayLightTheme;
  }
  return nemipayLightTheme;
}

export { lightColors };
