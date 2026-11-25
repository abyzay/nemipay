import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { DashboardScreen } from '@/features/dashboard/components';
import type { MovementsPage } from '@/features/movements/types';
import { useUiStore } from '@/stores';

const mockFetchMerchantProfile = jest.fn();
const mockFetchDailySummary = jest.fn();
const mockFetchMovementsPage = jest.fn();

jest.mock('@/features/authentication/services', () => {
  const actual = jest.requireActual('@/features/authentication/services');
  return {
    ...actual,
    fetchMerchantProfile: (...args: unknown[]) => mockFetchMerchantProfile(...args),
  };
});

jest.mock('@/features/payments/services/chargesService', () => {
  const actual = jest.requireActual('@/features/payments/services/chargesService');
  return {
    ...actual,
    fetchDailySummary: (...args: unknown[]) => mockFetchDailySummary(...args),
  };
});

jest.mock('@/features/movements/services', () => {
  const actual = jest.requireActual('@/features/movements/services');
  return {
    ...actual,
    fetchMovementsPage: (...args: unknown[]) => mockFetchMovementsPage(...args),
  };
});

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  },
}));

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

describe('DashboardScreen (Inicio)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUiStore.setState({
      authenticatedUser: {
        id: 'merchant-1',
        email: 'maria@nemipay.mx',
        displayName: 'María',
      },
      sessionStatus: 'authenticated',
      shiftActive: false,
      lastChargeMode: 'products',
    });

    mockFetchMerchantProfile.mockResolvedValue({
      id: 'merchant-1',
      name: 'María',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    mockFetchDailySummary.mockResolvedValue({
      totalConfirmedCents: 245000,
      countConfirmed: 3,
    });

    const page: MovementsPage = {
      items: [
        {
          id: 'chg-1',
          concept: 'Pago recibido',
          amountCents: 14500,
          currency: 'MXN',
          timeLabel: 'Hoy, 06:32 p.m.',
          status: 'CONFIRMED',
          paidAfterExpiry: false,
          createdAt: '2026-11-25T18:32:00.000Z',
        },
        {
          id: 'chg-2',
          concept: 'Café americano',
          amountCents: 5000,
          currency: 'MXN',
          timeLabel: 'Ayer, 03:20 p.m.',
          status: 'EXPIRED',
          paidAfterExpiry: false,
          createdAt: '2026-11-24T15:20:00.000Z',
        },
        {
          id: 'chg-3',
          concept: 'Venta con QR',
          amountCents: 23000,
          currency: 'MXN',
          timeLabel: 'Ayer, 11:45 a.m.',
          status: 'CONFIRMED',
          paidAfterExpiry: false,
          createdAt: '2026-11-24T11:45:00.000Z',
        },
      ],
      nextPage: 1,
      totalCount: 5,
    };
    mockFetchMovementsPage.mockResolvedValue(page);
  });

  it('muestra el saludo, pagos recibidos hoy, acciones rápidas y los últimos 3 movimientos', async () => {
    await renderWithProviders(<DashboardScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-today-amount')).toHaveTextContent('$2,450.00');
    });

    expect(screen.getByTestId('dashboard-greeting')).toHaveTextContent('¡Hola, María!');
    expect(screen.getByText('Tu negocio en buenas manos')).toBeOnTheScreen();
    expect(screen.getByText('Pagos recibidos hoy')).toBeOnTheScreen();
    expect(screen.getByText('MXN')).toBeOnTheScreen();
    expect(screen.getByTestId('dashboard-today-count')).toHaveTextContent('3 cobros confirmados');

    expect(screen.getByTestId('dashboard-action-qr')).toBeOnTheScreen();
    expect(screen.getByTestId('dashboard-action-pos')).toBeOnTheScreen();
    expect(screen.getByTestId('dashboard-action-movements')).toBeOnTheScreen();
    expect(screen.getByTestId('dashboard-action-profile')).toBeOnTheScreen();

    expect(screen.getByText('Actividad reciente')).toBeOnTheScreen();
    expect(screen.getByTestId('dashboard-see-more-activity')).toBeOnTheScreen();

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-movement-row-chg-1')).toBeOnTheScreen();
      expect(screen.getByTestId('dashboard-movement-row-chg-2')).toBeOnTheScreen();
      expect(screen.getByTestId('dashboard-movement-row-chg-3')).toBeOnTheScreen();
    });

    expect(mockFetchMovementsPage).toHaveBeenCalledWith({
      page: 0,
      pageSize: 5,
      filter: 'all',
      search: '',
    });
  });

  it('navega correctamente desde acciones rápidas, card del día, ver más y movimientos', async () => {
    await renderWithProviders(<DashboardScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-movement-row-chg-1')).toBeOnTheScreen();
    });

    // POS navega a /pos y actualiza modo de cobro
    await fireEvent.press(screen.getByTestId('dashboard-action-pos'));
    expect(useUiStore.getState().lastChargeMode).toBe('products');
    expect(router.push).toHaveBeenCalledWith('/pos');

    // Cobrar con QR lleva a monto libre (/cobrar)
    await fireEvent.press(screen.getByTestId('dashboard-action-qr'));
    expect(useUiStore.getState().lastChargeMode).toBe('free_amount');
    expect(router.push).toHaveBeenCalledWith('/cobrar');

    // Ver más lleva a /activity
    await fireEvent.press(screen.getByTestId('dashboard-see-more-activity'));
    expect(router.push).toHaveBeenCalledWith('/activity');

    // Card de pagos del día lleva a /activity
    await fireEvent.press(screen.getByTestId('dashboard-today-card'));
    expect(router.push).toHaveBeenCalledWith('/activity');

    // Movimientos lleva a /activity
    await fireEvent.press(screen.getByTestId('dashboard-action-movements'));
    expect(router.push).toHaveBeenCalledWith('/activity');

    // Perfil lleva a /profile
    await fireEvent.press(screen.getByTestId('dashboard-action-profile'));
    expect(router.push).toHaveBeenCalledWith('/profile');

    // Tocar un movimiento abre /collect
    await fireEvent.press(screen.getByTestId('dashboard-movement-row-chg-1'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/collect',
      params: { chargeId: 'chg-1' },
    });
  });
});
