import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { ChargeScreen, CobrarScreen } from '@/features/payments/components';
import type { Charge } from '@/features/payments/types';
import { useUiStore } from '@/stores';

const mockCreateCharge = jest.fn();
const mockCancelCharge = jest.fn();
const mockFetchDailySummary = jest.fn();
const mockFetchChargeById = jest.fn();

jest.mock('@/features/bills/services/billsService', () => ({
  fetchBillDetail: jest.fn(),
  createShareCharge: jest.fn(),
  cancelBill: jest.fn(),
  createBill: jest.fn(),
  fetchOpenBills: jest.fn(async () => []),
}));

jest.mock('@/features/payments/services/chargesService', () => {
  const actual = jest.requireActual('@/features/payments/services/chargesService');
  return {
    ...actual,
    createCharge: (...args: unknown[]) => mockCreateCharge(...args),
    cancelCharge: (...args: unknown[]) => mockCancelCharge(...args),
    fetchDailySummary: (...args: unknown[]) => mockFetchDailySummary(...args),
    fetchChargeById: (...args: unknown[]) => mockFetchChargeById(...args),
  };
});

jest.mock('@/services/supabase', () => ({
  supabase: {
    channel: () => ({
      on: () => ({
        subscribe: () => ({ id: 'chan-mock' }),
      }),
    }),
    removeChannel: jest.fn(async () => 'ok'),
  },
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}));

jest.mock('react-native-qrcode-svg', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return ({ value, size }: { value: string; size: number }) =>
    createElement(View, {
      testID: 'mock-qr-svg',
      accessibilityLabel: `${value}-${size}`,
    });
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

describe('CobrarScreen (/cobrar) y ChargeScreen (/collect)', () => {
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
      announcedChargeIds: {},
    });

    mockFetchDailySummary.mockResolvedValue({
      totalConfirmedCents: 125000,
      countConfirmed: 4,
    });
  });

  it('CobrarScreen muestra el teclado de monto libre sin tab de Productos ni Iniciar turno', async () => {
    const onBackPress = jest.fn();
    await renderWithProviders(<CobrarScreen onBackPress={onBackPress} />);

    expect(screen.getByText('Cobrar con QR')).toBeOnTheScreen();
    expect(screen.queryByTestId('cobrar-mode-products')).toBeNull();
    expect(screen.queryByTestId('cobrar-mode-free_amount')).toBeNull();
    expect(screen.queryByTestId('start-shift-button')).toBeNull();
    expect(screen.queryByTestId('shift-active-badge')).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId('cobrar-today-summary')).toHaveTextContent(
        'Hoy: $1,250 · 4 cobros'
      );
    });

    await fireEvent.press(screen.getByTestId('keypad-key-1'));
    await fireEvent.press(screen.getByTestId('keypad-key-5'));
    await fireEvent.press(screen.getByTestId('keypad-key-0'));
    expect(screen.getByTestId('free-amount-display')).toHaveTextContent('$150.00');

    await fireEvent.press(screen.getByTestId('free-amount-add-concept-toggle'));
    await fireEvent.changeText(screen.getByTestId('free-amount-concept-input'), 'Café con leche');

    const createdCharge: Charge = {
      id: 'bb7d7aac-f256-4e36-b32c-ecd2d8117054',
      status: 'AWAITING_PAYMENT',
      amountCents: 15000,
      currency: 'MXN',
      concept: 'Café con leche',
      items: null,
      qrPayload: 'CODI://PAYLOAD',
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      paidAt: null,
      paidAfterExpiry: false,
      failureReason: null,
      createdAt: new Date().toISOString(),
    };
    mockCreateCharge.mockResolvedValue(createdCharge);

    await fireEvent.press(screen.getByTestId('free-amount-charge-button'));

    await waitFor(() => {
      expect(mockCreateCharge).toHaveBeenCalledWith(
        { amountCents: 15000, concept: 'Café con leche' },
        expect.any(String)
      );
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/collect',
        params: { chargeId: 'bb7d7aac-f256-4e36-b32c-ecd2d8117054' },
      });
    });

    await fireEvent.press(screen.getByTestId('cobrar-back-button'));
    expect(onBackPress).toHaveBeenCalledTimes(1);
  });

  it('ChargeScreen muestra el QR protagonista con monto, concepto, reloj y cancelación', async () => {
    const charge: Charge = {
      id: 'bb7d7aac-f256-4e36-b32c-ecd2d8117054',
      status: 'AWAITING_PAYMENT',
      amountCents: 24500,
      currency: 'MXN',
      concept: 'Venta mostrador',
      items: null,
      qrPayload: 'CODI://QR-TEST',
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      paidAt: null,
      paidAfterExpiry: false,
      failureReason: null,
      createdAt: new Date().toISOString(),
    };
    mockFetchChargeById.mockResolvedValue(charge);
    mockCancelCharge.mockResolvedValue({ ...charge, status: 'CANCELLED' });

    const onBackPress = jest.fn();
    await renderWithProviders(
      <ChargeScreen chargeId="bb7d7aac-f256-4e36-b32c-ecd2d8117054" onBackPress={onBackPress} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('charge-qr-stage')).toBeOnTheScreen();
    });

    expect(screen.getByTestId('charge-amount-display')).toHaveTextContent('$245.00');
    expect(screen.getByText('MXN')).toBeOnTheScreen();
    expect(screen.getByText('Venta mostrador')).toBeOnTheScreen();
    expect(screen.getByTestId('mock-qr-svg')).toBeOnTheScreen();
    expect(screen.getByText('Escanea con CoDi para pagar')).toBeOnTheScreen();
    expect(screen.getByTestId('charge-instruction-text')).toBeOnTheScreen();
    expect(screen.getByTestId('charge-countdown')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('charge-cancel-button'));
    expect(screen.getByTestId('charge-cancel-prompt')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('charge-confirm-cancel-button'));
    await waitFor(() => {
      expect(mockCancelCharge).toHaveBeenCalledWith('bb7d7aac-f256-4e36-b32c-ecd2d8117054');
      expect(onBackPress).toHaveBeenCalledTimes(1);
    });
  });
});
