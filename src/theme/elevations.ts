import { shadows, type ShadowStyle, type ShadowTokens } from './shadows';

export const elevations = {
  none: shadows.none,
  xs: shadows.card,
  sm: shadows.card,
  md: shadows.floating,
} as const;

export type ElevationStyle = ShadowStyle;
export type ElevationTokens = typeof elevations;
export { shadows };
export type { ShadowTokens };
