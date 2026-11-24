/**
 * Escala centralizada de border radius de NemiPay.
 */
export const radius = {
  radiusXS: 4,
  radiusSM: 8,
  radiusMD: 12,
  radiusInput: 14,
  radiusButton: 16,
  radiusCard: 18,
  radiusBalanceCard: 20,
  radiusLarge: 22,
  radiusSheet: 24,
  radiusFull: 999,
} as const;

/**
 * Alias estructurado para compatibilidad con componentes existentes.
 */
export const radii = {
  none: 0,
  xs: radius.radiusXS,
  sm: radius.radiusSM,
  md: radius.radiusMD,
  input: radius.radiusInput,
  button: radius.radiusButton,
  lg: radius.radiusCard,
  card: radius.radiusCard,
  balanceCard: radius.radiusBalanceCard,
  xl: radius.radiusLarge,
  sheet: radius.radiusSheet,
  full: radius.radiusFull,
} as const;

export type RadiusTokens = typeof radius;
export type RadiiTokens = typeof radii;
