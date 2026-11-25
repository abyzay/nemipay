import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import type { MerchantProfile } from '@/features/authentication/types';
import { ProfileScreen } from '@/features/profile/components';
import { useUiStore } from '@/stores';

const mockFetchMerchantProfile = jest.fn();
const mockUpdateMerchantProfile = jest.fn();

jest.mock('@/features/authentication/services', () => {
  const actual = jest.requireActual('@/features/authentication/services');
  return {
    ...actual,
    fetchMerchantProfile: (...args: unknown[]) => mockFetchMerchantProfile(...args),
    updateMerchantProfile: (...args: unknown[]) => mockUpdateMerchantProfile(...args),
  };
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AppProviders
      client={createQueryClient()}
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      {ui}
    </AppProviders>
  );
}

describe('ProfileScreen (Mi perfil)', () => {
  let merchantState: MerchantProfile;

  beforeEach(() => {
    jest.clearAllMocks();
    useUiStore.setState({
      authenticatedUser: {
        id: 'merchant-1',
        email: 'demo@nemipay.mx',
        displayName: 'Tacos Nemi',
      },
      sessionStatus: 'authenticated',
      shiftActive: false,
    });

    merchantState = {
      id: 'merchant-1',
      name: 'Tacos Nemi',
      ownerName: 'María López',
      phone: '+52 55 1234 5678',
      clabe: null,
      bankName: null,
      notificationsEnabled: true,
      voiceAnnouncementsEnabled: true,
      createdAt: '2026-11-25T00:00:00.000Z',
    };

    mockFetchMerchantProfile.mockImplementation(async () => ({ ...merchantState }));
    mockUpdateMerchantProfile.mockImplementation(async (_id, patch) => {
      merchantState = {
        ...merchantState,
        ...patch,
      };
      return { ...merchantState };
    });
  });

  it('muestra cabecera, menú completo, edita Mis datos y configura cuenta CLABE de 18 dígitos', async () => {
    await renderWithProviders(<ProfileScreen onBackPress={jest.fn()} onLogoutPress={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-merchant-name')).toHaveTextContent('María López');
    });

    expect(screen.getByTestId('profile-backdrop')).toBeOnTheScreen();
    expect(screen.getByTestId('profile-business-subtitle')).toHaveTextContent('Tacos Nemi');
    expect(screen.getByTestId('profile-contact-subtitle')).toHaveTextContent('+52 55 1234 5678');
    expect(screen.getByTestId('profile-menu-data')).toBeOnTheScreen();
    expect(screen.getByTestId('profile-menu-payment')).toBeOnTheScreen();
    expect(screen.getByTestId('profile-menu-notifications')).toBeOnTheScreen();
    expect(screen.getByTestId('profile-menu-help')).toBeOnTheScreen();
    expect(screen.getByTestId('profile-logout-button')).toBeOnTheScreen();
    expect(screen.getByTestId('profile-footer-logo')).toBeOnTheScreen();

    // Editar Mis datos
    await fireEvent.press(screen.getByTestId('profile-menu-data'));
    expect(screen.getByTestId('profile-data-modal')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByTestId('profile-data-owner-input'), 'María González');
    await fireEvent.changeText(screen.getByTestId('profile-data-phone-input'), '+52 55 9999 0000');
    await fireEvent.press(screen.getByTestId('profile-data-save-button'));

    await waitFor(() => {
      expect(mockUpdateMerchantProfile).toHaveBeenCalledWith(
        'merchant-1',
        expect.objectContaining({
          name: 'Tacos Nemi',
          ownerName: 'María González',
          phone: '+52 55 9999 0000',
        })
      );
      expect(screen.getByTestId('profile-merchant-name')).toHaveTextContent('María González');
    });

    // Configurar Cuenta CLABE (valida 18 dígitos)
    await fireEvent.press(screen.getByTestId('profile-menu-payment'));
    expect(screen.getByTestId('profile-payment-method-modal')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('profile-clabe-input'), '012180');
    await fireEvent.press(screen.getByTestId('profile-clabe-save-button'));
    expect(screen.getByTestId('profile-sheet-error')).toHaveTextContent(
      'La cuenta CLABE debe tener exactamente 18 dígitos.'
    );

    await fireEvent.changeText(screen.getByTestId('profile-clabe-input'), '012180015544332211');
    await fireEvent.press(screen.getByTestId('profile-bank-chip-BBVA'));
    await fireEvent.press(screen.getByTestId('profile-clabe-save-button'));

    await waitFor(() => {
      expect(mockUpdateMerchantProfile).toHaveBeenCalledWith('merchant-1', {
        clabe: '012180015544332211',
        bankName: 'BBVA',
      });
      expect(screen.getByText('CLABE •••• 2211')).toBeOnTheScreen();
    });
  });

  it('permite gestionar notificaciones, turno y confirmar cerrar sesión', async () => {
    const onLogoutPress = jest.fn();
    await renderWithProviders(
      <ProfileScreen onBackPress={jest.fn()} onLogoutPress={onLogoutPress} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-menu-notifications')).toBeOnTheScreen();
    });

    await fireEvent.press(screen.getByTestId('profile-menu-notifications'));
    expect(screen.getByTestId('profile-notifications-modal')).toBeOnTheScreen();

    await fireEvent(screen.getByTestId('profile-notifications-switch'), 'valueChange', false);
    await waitFor(() => {
      expect(mockUpdateMerchantProfile).toHaveBeenCalledWith('merchant-1', {
        notificationsEnabled: false,
      });
    });

    await fireEvent.press(screen.getByTestId('profile-shift-toggle-button'));
    await waitFor(() => {
      expect(useUiStore.getState().shiftActive).toBe(true);
    });

    await fireEvent.press(screen.getByTestId('profile-notifications-close-button'));

    // Cerrar sesión con confirmación
    await fireEvent.press(screen.getByTestId('profile-logout-button'));
    expect(screen.getByTestId('profile-logout-modal')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('profile-logout-confirm-button'));
    expect(onLogoutPress).toHaveBeenCalledTimes(1);
  });
});
