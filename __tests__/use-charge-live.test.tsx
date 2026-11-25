import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { useChargeLive } from '@/features/payments/hooks/useChargeLive';

const mockRemoveChannel = jest.fn(async (_channel?: unknown) => 'ok');
let realtimeHandler: ((payload: { new: Record<string, unknown> }) => void) | null = null;
const mockSubscribe = jest.fn(() => ({ id: 'chan-1' }));
const mockOn = jest.fn(
  (_event: string, _filter: unknown, cb: (payload: { new: Record<string, unknown> }) => void) => {
    realtimeHandler = cb;
    return { subscribe: mockSubscribe };
  }
);
const mockChannel = jest.fn((_name: string) => ({ on: mockOn }));
const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn((_table: string) => ({ select: mockSelect }));

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    channel: (name: string) => mockChannel(name),
    removeChannel: (channel: unknown) => mockRemoveChannel(channel),
  },
}));

const mockCheckCharge = jest.fn();
jest.mock('@/features/payments/services/chargesService', () => {
  const actual = jest.requireActual('@/features/payments/services/chargesService');
  return {
    ...actual,
    checkCharge: (...args: unknown[]) => mockCheckCharge(...args),
  };
});

describe('useChargeLive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    realtimeHandler = null;
  });

  it('lee el cobro inicial, actualiza por Realtime y cancela suscripción al llegar a CONFIRMED', async () => {
    const baseRow = {
      id: '11111111-1111-1111-1111-111111111111',
      merchant_id: '22222222-2222-2222-2222-222222222222',
      amount_cents: 8000,
      currency: 'MXN',
      concept: 'Cobro NemiPay',
      items: null,
      status: 'AWAITING_PAYMENT',
      idempotency_key: 'idem-1',
      request_hash: 'hash-1',
      pey_reference: 'ref-1',
      pey_transaction_id: null,
      qr_payload: 'CODI://QR',
      expires_at: new Date(Date.now() + 600_000).toISOString(),
      paid_at: null,
      paid_after_expiry: false,
      failure_reason: null,
      last_checked_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSingle.mockResolvedValue({ data: baseRow, error: null });

    const client = createQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProviders
        client={client}
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        {children}
      </AppProviders>
    );

    const { result, unmount } = await renderHook(() => useChargeLive(baseRow.id), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.status).toBe('AWAITING_PAYMENT');
    });

    expect(mockChannel).toHaveBeenCalledWith(`charge-live-${baseRow.id}`);
    expect(realtimeHandler).not.toBeNull();

    act(() => {
      realtimeHandler?.({
        new: {
          ...baseRow,
          status: 'CONFIRMED',
          paid_at: new Date().toISOString(),
        },
      });
    });

    await waitFor(() => {
      expect(result.current.data?.status).toBe('CONFIRMED');
    });

    // Al llegar a estado terminal se cancela la suscripción Realtime
    await waitFor(() => {
      expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
    });

    unmount();
    client.clear();
  });
});
