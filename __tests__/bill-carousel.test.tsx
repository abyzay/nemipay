import React from 'react';
import * as Speech from 'expo-speech';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { BillScreen } from '@/features/bills/components/BillScreen';
import type { BillDetail } from '@/features/bills/types';
import { FreeAmountKeypad } from '@/features/payments/components';
import { useUiStore } from '@/stores';

const mockFetchBillDetail = jest.fn();
const mockCreateShareCharge = jest.fn();
const mockCancelBill = jest.fn();
const mockCreateBill = jest.fn();
const mockCheckCharge = jest.fn();

const realtimeListeners: (() => void)[] = [];

jest.mock('@/features/bills/services/billsService', () => {
  const actual = jest.requireActual('@/features/bills/services/billsService');
  return {
    ...actual,
    fetchBillDetail: (...args: unknown[]) => mockFetchBillDetail(...args),
    createShareCharge: (...args: unknown[]) => mockCreateShareCharge(...args),
    cancelBill: (...args: unknown[]) => mockCancelBill(...args),
    createBill: (...args: unknown[]) => mockCreateBill(...args),
    fetchOpenBills: jest.fn(async () => []),
  };
});

jest.mock('@/features/payments/services/chargesService', () => {
  const actual = jest.requireActual('@/features/payments/services/chargesService');
  return {
    ...actual,
    checkCharge: (...args: unknown[]) => mockCheckCharge(...args),
  };
});

jest.mock('@/services/supabase', () => ({
  supabase: {
    channel: () => {
      const builder = {
        on: (_event: string, _filter: unknown, cb: () => void) => {
          realtimeListeners.push(cb);
          return builder;
        },
        subscribe: () => ({ id: 'bill-chan-mock' }),
      };
      return builder;
    },
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

describe('BillScreen, BillCarousel y SplitSetupSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    realtimeListeners.length = 0;
    useUiStore.setState({
      authenticatedUser: {
        id: 'merchant-1',
        email: 'tacos@nemipay.mx',
        displayName: 'Taquería Nemi',
      },
      sessionStatus: 'authenticated',
      announcedChargeIds: {},
    });
    mockCheckCharge.mockResolvedValue({ status: 'AWAITING_PAYMENT' });
  });

  it('reconstruye el carrusel al recargar en la parte pendiente, avanza al pagar y anuncia una sola vez ante eventos duplicados', async () => {
    jest.useFakeTimers();

    const billId = 'bill-1';
    const initialDetail: BillDetail = {
      bill: {
        id: billId,
        concept: 'Tacos mesa 4',
        items: null,
        totalCents: 20000,
        splitMode: 'EQUAL',
        status: 'PARTIALLY_PAID',
        collectedCents: 10000,
        overpaidCents: 0,
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        closedAt: null,
        createdAt: new Date().toISOString(),
      },
      participants: [
        {
          id: 'p-1',
          billId,
          position: 1,
          label: 'Persona 1',
          shareCents: 10000,
          createdAt: new Date().toISOString(),
          state: 'PAID',
          paidAt: new Date().toISOString(),
          charge: {
            id: 'chg-p1',
            status: 'CONFIRMED',
            amountCents: 10000,
            qrPayload: 'CODI://1',
            expiresAt: new Date(Date.now() + 300_000).toISOString(),
            paidAt: new Date().toISOString(),
            paidAfterExpiry: false,
            createdAt: new Date().toISOString(),
          },
        },
        {
          id: 'p-2',
          billId,
          position: 2,
          label: 'Persona 2',
          shareCents: 10000,
          createdAt: new Date().toISOString(),
          state: 'PAYING',
          paidAt: null,
          charge: {
            id: 'chg-p2',
            status: 'AWAITING_PAYMENT',
            amountCents: 10000,
            qrPayload: 'CODI://2',
            expiresAt: new Date(Date.now() + 300_000).toISOString(),
            paidAt: null,
            paidAfterExpiry: false,
            createdAt: new Date().toISOString(),
          },
        },
      ],
    };

    const p1 = initialDetail.participants[0]!;
    const p2 = initialDetail.participants[1]!;

    const settledDetail: BillDetail = {
      bill: {
        ...initialDetail.bill,
        status: 'PAID',
        collectedCents: 20000,
        closedAt: new Date().toISOString(),
      },
      participants: [
        p1,
        {
          ...p2,
          state: 'PAID',
          paidAt: new Date().toISOString(),
          charge: {
            ...p2.charge!,
            status: 'CONFIRMED',
            paidAt: new Date().toISOString(),
          },
        },
      ],
    };

    mockFetchBillDetail.mockResolvedValueOnce(initialDetail).mockResolvedValue(settledDetail);

    await renderWithProviders(<BillScreen billId={billId} onBackPress={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('share-qr-stage-p-2')).toBeOnTheScreen();
    });
    // Al recargar, no re-anuncia el pago previo de p-1
    expect(Speech.speak).not.toHaveBeenCalled();

    // Dos eventos duplicados de Realtime al confirmarse chg-p2
    await act(async () => {
      realtimeListeners.forEach((cb) => cb());
      realtimeListeners.forEach((cb) => cb());
    });

    await waitFor(() => {
      expect(screen.getByTestId('bill-paid-fullscreen')).toBeOnTheScreen();
    });

    // Voz se anuncia exactamente una vez para chg-p2
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    expect(Speech.speak).toHaveBeenCalledWith(
      'Cuenta liquidada, doscientos pesos.',
      expect.objectContaining({ language: 'es-MX' })
    );

    jest.useRealTimers();
  });

  it('regenera un QR vencido con nueva Idempotency-Key', async () => {
    const billId = 'bill-expired-qr';
    const detailExpired: BillDetail = {
      bill: {
        id: billId,
        concept: 'Mesa 2',
        items: null,
        totalCents: 10000,
        splitMode: 'EQUAL',
        status: 'OPEN',
        collectedCents: 0,
        overpaidCents: 0,
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        closedAt: null,
        createdAt: new Date().toISOString(),
      },
      participants: [
        {
          id: 'p-exp',
          billId,
          position: 1,
          label: 'Persona 1',
          shareCents: 5000,
          createdAt: new Date().toISOString(),
          state: 'PENDING',
          paidAt: null,
          charge: {
            id: 'chg-old',
            status: 'EXPIRED',
            amountCents: 5000,
            qrPayload: 'CODI://OLD',
            expiresAt: new Date(Date.now() - 60_000).toISOString(),
            paidAt: null,
            paidAfterExpiry: false,
            createdAt: new Date().toISOString(),
          },
        },
        {
          id: 'p-next',
          billId,
          position: 2,
          label: 'Persona 2',
          shareCents: 5000,
          createdAt: new Date().toISOString(),
          state: 'PAYING',
          paidAt: null,
          charge: {
            id: 'chg-2',
            status: 'AWAITING_PAYMENT',
            amountCents: 5000,
            qrPayload: 'CODI://NEXT',
            expiresAt: new Date(Date.now() + 300_000).toISOString(),
            paidAt: null,
            paidAfterExpiry: false,
            createdAt: new Date().toISOString(),
          },
        },
      ],
    };

    mockFetchBillDetail.mockResolvedValue(detailExpired);
    mockCreateShareCharge.mockResolvedValue({
      chargeId: 'chg-new',
      billId,
      participantId: 'p-exp',
      amountCents: 5000,
      qrPayload: 'CODI://NEW',
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      status: 'AWAITING_PAYMENT',
    });

    await renderWithProviders(<BillScreen billId={billId} onBackPress={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('share-expired-card-p-exp')).toBeOnTheScreen();
    });

    await fireEvent.press(screen.getByTestId('share-regenerate-button-p-exp'));

    await waitFor(() => {
      expect(mockCreateShareCharge).toHaveBeenCalledWith(
        { billId, participantId: 'p-exp' },
        expect.any(String)
      );
    });
  });

  it('soporta modo Libre creando aportación desde FreeContributionSlide', async () => {
    const billId = 'bill-free-1';
    const freeDetail: BillDetail = {
      bill: {
        id: billId,
        concept: 'Mesa Libre',
        items: null,
        totalCents: 10000,
        splitMode: 'FREE',
        status: 'OPEN',
        collectedCents: 0,
        overpaidCents: 0,
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        closedAt: null,
        createdAt: new Date().toISOString(),
      },
      participants: [],
    };

    mockFetchBillDetail.mockResolvedValue(freeDetail);
    mockCreateShareCharge.mockResolvedValue({
      chargeId: 'chg-free-1',
      billId,
      participantId: 'p-free-1',
      amountCents: 4000,
      qrPayload: 'CODI://FREE1',
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      status: 'AWAITING_PAYMENT',
    });

    await renderWithProviders(<BillScreen billId={billId} onBackPress={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('free-contribution-slide')).toBeOnTheScreen();
    });

    await fireEvent.changeText(screen.getByTestId('free-share-label-input'), 'Ana');
    await fireEvent.changeText(screen.getByTestId('free-share-amount-input'), '40');
    await fireEvent.press(screen.getByTestId('free-share-submit-button'));

    await waitFor(() => {
      expect(mockCreateShareCharge).toHaveBeenCalledWith(
        { billId, amountCents: 4000, label: 'Ana' },
        expect.any(String)
      );
    });
  });

  it('FreeAmountKeypad abre SplitSetupSheet al marcar el checkbox Dividir cuenta', async () => {
    mockCreateBill.mockResolvedValue({
      billId: 'bill-from-keypad',
      totalCents: 20000,
      status: 'OPEN',
      splitMode: 'EQUAL',
      concept: 'Cuenta compartida',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      participants: [],
    });

    await renderWithProviders(<FreeAmountKeypad />);

    await fireEvent.press(screen.getByTestId('keypad-key-2'));
    await fireEvent.press(screen.getByTestId('keypad-key-0'));
    await fireEvent.press(screen.getByTestId('keypad-key-0'));
    expect(screen.getByTestId('free-amount-display')).toHaveTextContent('$200.00');

    await fireEvent.press(screen.getByTestId('free-amount-split-checkbox'));
    await fireEvent.press(screen.getByTestId('free-amount-charge-button'));

    await waitFor(() => {
      expect(screen.getByTestId('split-setup-sheet')).toBeOnTheScreen();
    });

    expect(screen.getByTestId('split-setup-total')).toHaveTextContent('$200.00 MXN');

    await fireEvent.press(screen.getByTestId('split-people-plus'));
    await fireEvent.press(screen.getByTestId('split-people-plus'));
    expect(screen.getByTestId('split-people-count')).toHaveTextContent('4');

    await fireEvent.press(screen.getByTestId('split-create-bill-button'));

    await waitFor(() => {
      expect(mockCreateBill).toHaveBeenCalledWith(
        {
          amountCents: 20000,
          concept: 'Cuenta compartida',
          split: { mode: 'EQUAL', people: 4 },
        },
        expect.any(String)
      );
    });
  });
});
