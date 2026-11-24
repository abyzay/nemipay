import { MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { getColors, lightColors, type ThemeMode } from './colors';
import { radii } from './radius';
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
      onPrimary: palette.textOnPrimary,
      primaryContainer: palette.lavender,
      onPrimaryContainer: palette.primaryDark,
      secondary: palette.lavender,
      onSecondary: palette.primary,
      secondaryContainer: palette.lavenderSoft,
      onSecondaryContainer: palette.primaryDark,
      background: palette.background,
      onBackground: palette.textPrimary,
      surface: palette.surfaceCard,
      onSurface: palette.textPrimary,
      surfaceVariant: palette.surface,
      onSurfaceVariant: palette.textSecondary,
      outline: palette.border,
      outlineVariant: palette.divider,
      error: palette.error,
      onError: palette.textOnPrimary,
      surfaceDisabled: palette.surfaceSecondary,
      onSurfaceDisabled: palette.textDisabled,
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
