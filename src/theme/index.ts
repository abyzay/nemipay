import { getColors, lightColors } from './colors';
import { commonStyles } from './commonStyles';
import { elevations } from './elevations';
import { buildPaperTheme, getPaperTheme, nemipayLightTheme } from './paperTheme';
import { radii } from './radii';
import { layoutMetrics, spacing } from './spacing';
import { fontFamilies, paperFonts, typographyScale } from './typography';

export const nemipayTheme = {
  colors: lightColors,
  spacing,
  layout: layoutMetrics,
  radii,
  elevations,
  typography: {
    families: fontFamilies,
    scale: typographyScale,
  },
} as const;

export type NemipayTheme = typeof nemipayTheme;

export {
  buildPaperTheme,
  commonStyles,
  elevations,
  fontFamilies,
  getColors,
  getPaperTheme,
  layoutMetrics,
  lightColors,
  nemipayLightTheme,
  paperFonts,
  radii,
  spacing,
  typographyScale,
};
export type { ColorPalette, ThemeMode } from './colors';
export type { ElevationStyle, ElevationTokens } from './elevations';
export type { RadiiTokens } from './radii';
export type { LayoutMetrics, SpacingTokens } from './spacing';
