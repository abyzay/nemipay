export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  onPrimary: string;
  onSecondary: string;
  onSurface: string;
  disabled: string;
}

export const lightColors: ColorPalette = {
  primary: '#087F5B',
  primaryDark: '#064E3B',
  secondary: '#DDF5EA',
  background: '#F7FAF8',
  surface: '#FFFFFF',
  textPrimary: '#202B26',
  textSecondary: '#78857E',
  border: '#E7EDE9',
  success: '#15966A',
  warning: '#E8A23A',
  error: '#D64545',
  onPrimary: '#FFFFFF',
  onSecondary: '#064E3B',
  onSurface: '#202B26',
  disabled: '#B8C4BD',
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
