export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const layoutMetrics = {
  minTouchTarget: 48,
  screenHorizontalPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
} as const;

export type SpacingTokens = typeof spacing;
export type LayoutMetrics = typeof layoutMetrics;
