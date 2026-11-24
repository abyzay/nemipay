/**
 * Sistema de espaciado basado en múltiplos de 4 px.
 */
export const spacing = {
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space5: 20,
  space6: 24,
  space8: 32,
  space10: 40,
  space12: 48,

  // Aliases de conveniencia
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
  screenHorizontalPadding: 24,
  cardPadding: 16,
  cardGap: 12,
  sectionGap: 24,
  itemGap: 8,
  formGroupGap: 16,
  buttonHeight: 54,
  inputHeight: 54,
  tabBarBaseHeight: 68,
} as const;

export type SpacingTokens = typeof spacing;
export type LayoutMetrics = typeof layoutMetrics;
