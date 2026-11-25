import { create } from 'zustand';
import type { AuthUser, SessionStatus } from '@/features/authentication/types';
import type { ThemeMode } from '@/theme/colors';

export type ChargeEntryMode = 'products' | 'free_amount';

interface UiState {
  themeMode: ThemeMode;
  sessionStatus: SessionStatus;
  authenticatedUser: AuthUser | null;
  shiftActive: boolean;
  lastChargeMode: ChargeEntryMode;
  announcedChargeIds: Record<string, true>;
  setThemeMode: (mode: ThemeMode) => void;
  setSessionStatus: (status: SessionStatus) => void;
  setAuthenticatedUser: (user: AuthUser | null) => void;
  setShiftActive: (active: boolean) => void;
  setLastChargeMode: (mode: ChargeEntryMode) => void;
  markChargeAnnounced: (chargeId: string) => void;
  hasAnnouncedCharge: (chargeId: string) => boolean;
  clearSession: () => void;
}

/**
 * Store global exclusivamente para estado local/visual de interfaz.
 * PROHIBIDO duplicar aquí datos remotos administrados por TanStack Query.
 */
export const useUiStore = create<UiState>((set, get) => ({
  themeMode: 'light',
  sessionStatus: 'unknown',
  authenticatedUser: null,
  shiftActive: false,
  lastChargeMode: 'free_amount',
  announcedChargeIds: {},
  setThemeMode: (themeMode) => set({ themeMode }),
  setSessionStatus: (sessionStatus) => set({ sessionStatus }),
  setAuthenticatedUser: (authenticatedUser) =>
    set({
      authenticatedUser,
      sessionStatus: authenticatedUser ? 'authenticated' : 'unauthenticated',
    }),
  setShiftActive: (shiftActive) => set({ shiftActive }),
  setLastChargeMode: (lastChargeMode) => set({ lastChargeMode }),
  markChargeAnnounced: (chargeId) =>
    set((state) => ({
      announcedChargeIds: {
        ...state.announcedChargeIds,
        [chargeId]: true,
      },
    })),
  hasAnnouncedCharge: (chargeId) => Boolean(get().announcedChargeIds[chargeId]),
  clearSession: () =>
    set({
      authenticatedUser: null,
      sessionStatus: 'unauthenticated',
      shiftActive: false,
    }),
}));
