import { getColors, grayScale, lightColors } from './colors';
import { commonStyles } from './commonStyles';
import { elevations } from './elevations';
import { buildPaperTheme, getPaperTheme, nemipayLightTheme } from './paperTheme';
import { radii, radius } from './radius';
import { shadows } from './shadows';
import { layoutMetrics, spacing } from './spacing';
import { animationDurations, iconSizes, tokens } from './tokens';
import { fontFamilies, paperFonts, tabularNumbersStyle, typographyScale } from './typography';

export const nemipayTheme = tokens;

export type NemipayTheme = typeof nemipayTheme;

export {
  animationDurations,
  buildPaperTheme,
  commonStyles,
  elevations,
  fontFamilies,
  getColors,
  getPaperTheme,
  grayScale,
  iconSizes,
  layoutMetrics,
  lightColors,
  nemipayLightTheme,
  paperFonts,
  radii,
  radius,
  shadows,
  spacing,
  tabularNumbersStyle,
  tokens,
  typographyScale,
};
export type { ColorPalette, ThemeMode } from './colors';
export type { ElevationStyle, ElevationTokens } from './elevations';
export type { RadiiTokens, RadiusTokens } from './radius';
export type { ShadowStyle, ShadowTokens } from './shadows';
export type { LayoutMetrics, SpacingTokens } from './spacing';
export type { DesignTokens } from './tokens';
export type { FontFamilies, TypographyScale } from './typography';
