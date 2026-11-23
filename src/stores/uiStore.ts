import { create } from 'zustand';
import type { ThemeMode } from '@/theme/colors';

interface UiState {
  themeMode: ThemeMode;
  isBiometricLocked: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setBiometricLocked: (locked: boolean) => void;
}

/**
 * Store global exclusivamente para estado local/visual de interfaz.
 * PROHIBIDO duplicar aquí datos remotos administrados por TanStack Query.
 */
export const useUiStore = create<UiState>((set) => ({
  themeMode: 'light',
  isBiometricLocked: false,
  setThemeMode: (themeMode) => set({ themeMode }),
  setBiometricLocked: (isBiometricLocked) => set({ isBiometricLocked }),
}));
