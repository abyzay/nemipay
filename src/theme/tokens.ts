import { getColors, grayScale, lightColors } from './colors';
import { elevations } from './elevations';
import { radii, radius } from './radius';
import { shadows } from './shadows';
import { layoutMetrics, spacing } from './spacing';
import { fontFamilies, tabularNumbersStyle, typographyScale } from './typography';

export const animationDurations = {
  micro: 150,
  transition: 240,
  sheet: 300,
  confirmation: 500,
} as const;

export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 22,
  xl: 24,
  strokeWidth: 1.9,
} as const;

export const tokens = {
  colors: lightColors,
  gray: grayScale,
  spacing,
  layout: layoutMetrics,
  radius,
  radii,
  shadows,
  elevations,
  typography: {
    families: fontFamilies,
    scale: typographyScale,
    tabularNums: tabularNumbersStyle,
  },
  animation: animationDurations,
  icons: iconSizes,
} as const;

export type DesignTokens = typeof tokens;
export { getColors, lightColors };
