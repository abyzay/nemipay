import { create } from 'zustand';
import type { AuthUser } from '@/features/authentication/types';
import type { ThemeMode } from '@/theme/colors';

interface UiState {
  themeMode: ThemeMode;
  isBiometricLocked: boolean;
  authenticatedUser: AuthUser | null;
  setThemeMode: (mode: ThemeMode) => void;
  setBiometricLocked: (locked: boolean) => void;
  setAuthenticatedUser: (user: AuthUser | null) => void;
  clearSession: () => void;
}

/**
 * Store global exclusivamente para estado local/visual de interfaz.
 * PROHIBIDO duplicar aquí datos remotos administrados por TanStack Query.
 */
export const useUiStore = create<UiState>((set) => ({
  themeMode: 'light',
  isBiometricLocked: false,
  authenticatedUser: null,
  setThemeMode: (themeMode) => set({ themeMode }),
  setBiometricLocked: (isBiometricLocked) => set({ isBiometricLocked }),
  setAuthenticatedUser: (authenticatedUser) => set({ authenticatedUser }),
  clearSession: () => set({ authenticatedUser: null, isBiometricLocked: false }),
}));
