export type ThemeMode = 'light' | 'dark';

/**
 * Escala oficial de grises del Design System de NemiPay.
 */
export const grayScale = {
  50: '#FAF9FC',
  100: '#F4F2F7',
  200: '#E8E5EF',
  300: '#D5D1DF',
  400: '#A6A1B3',
  500: '#817B91',
  600: '#625C70',
  700: '#403B50',
  800: '#29243A',
  900: '#17152F',
} as const;

export interface ColorPalette {
  // Marca
  primary: string;
  primaryLight: string;
  primaryDark: string;
  lavender: string;
  lavenderSoft: string;
  lavenderBorder: string;

  // Superficies
  background: string;
  surface: string;
  surfaceCard: string;
  surfaceSecondary: string;
  border: string;
  divider: string;

  // Texto
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textOnPrimary: string;

  // Semánticos
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  warningText: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Escala de grises y overlays
  gray: typeof grayScale;
  backdrop: string;

  // Compatibilidad con integraciones existentes (Paper / hooks)
  secondary: string;
  onPrimary: string;
  onSecondary: string;
  onSurface: string;
  disabled: string;
}

export const lightColors: ColorPalette = {
  // Marca
  primary: '#7200D9',
  primaryLight: '#941EFF',
  primaryDark: '#5600A8',
  lavender: '#F3E9FF',
  lavenderSoft: '#FAF7FF',
  lavenderBorder: '#DCC7FA',

  // Superficies
  background: '#FFFFFF',
  surface: '#F8F7FB',
  surfaceCard: '#FFFFFF',
  surfaceSecondary: '#F4F2F7',
  border: '#E8E5EF',
  divider: '#F0EDF4',

  // Texto
  textPrimary: '#17152F',
  textSecondary: '#817B91',
  textMuted: '#A6A1B3',
  textDisabled: '#C5C1CD',
  textOnPrimary: '#FFFFFF',

  // Semánticos
  success: '#16A36A',
  successLight: '#E6F7EF',
  warning: '#F59E0B',
  warningLight: '#FFF7E6',
  warningText: '#B7791F',
  error: '#EF4444',
  errorLight: '#FEECEC',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Escala de grises y overlays
  gray: grayScale,
  backdrop: 'rgba(23, 21, 47, 0.45)',

  // Aliases de compatibilidad
  secondary: '#F3E9FF',
  onPrimary: '#FFFFFF',
  onSecondary: '#7200D9',
  onSurface: '#17152F',
  disabled: '#C5C1CD',
};

/**
 * Punto de extensión preparado para incorporar el tema oscuro en etapas futuras.
 * Actualmente retorna `lightColors` como base oficial hasta definir tokens dark aprobados.
 */
export function getColors(mode: ThemeMode = 'light'): ColorPalette {
  if (mode === 'dark') {
    return lightColors;
  }
  return lightColors;
}
