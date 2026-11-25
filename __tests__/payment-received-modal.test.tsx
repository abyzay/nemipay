import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { PaymentReceivedModal } from '@/features/payments/components';
import type { Charge } from '@/features/payments/types';

jest.mock('@react-native-vector-icons/ionicons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) =>
      createElement(Text, { testID: testID ?? `ionicon-${name}` }, name),
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

describe('PaymentReceivedModal (confirmación y comprobante)', () => {
  it('renderiza la pantalla de pago recibido y permite abrir el comprobante completo', async () => {
    const onAccept = jest.fn();
    const charge: Charge = {
      id: 'bb7d7aac-f256-4e36-b32c-ecd2d8117054',
      status: 'CONFIRMED',
      amountCents: 12500,
      currency: 'MXN',
      concept: 'Café con leche',
      items: [
        { productId: 'prod-1', name: 'Café americano', priceCents: 6000, quantity: 1 },
        { productId: 'prod-2', name: 'Pan dulce', priceCents: 6500, quantity: 1 },
      ],
      qrPayload: 'CODI://QR',
      peyReference: 'PEY-REF-1234',
      peyTransactionId: 'TXN-987654',
      expiresAt: '2026-11-25T18:40:00.000Z',
      paidAt: '2026-11-25T18:32:00.000Z',
      paidAfterExpiry: false,
      failureReason: null,
      createdAt: '2026-11-25T18:30:00.000Z',
    };

    await renderWithProviders(
      <PaymentReceivedModal
        visible
        amountCents={12500}
        timeLabel="Hoy, 06:32 p.m."
        concept="Café con leche"
        charge={charge}
        merchantName="Cafetería María"
        onAccept={onAccept}
      />
    );

    expect(screen.getByTestId('payment-received-modal')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-received-check-icon')).toBeOnTheScreen();
    expect(screen.getByText('¡Pago recibido!')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-received-amount')).toHaveTextContent('$125.00');
    expect(screen.getByText('MXN')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-received-concept')).toHaveTextContent('Café con leche');
    expect(screen.getByTestId('payment-received-time')).toHaveTextContent('Hoy, 06:32 p.m.');

    await fireEvent.press(screen.getByTestId('payment-received-receipt-button'));

    expect(screen.getByText('Comprobante de pago')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-receipt-card')).toBeOnTheScreen();
    expect(screen.getByText('Cafetería María')).toBeOnTheScreen();
    expect(screen.getByText('CoDi (QR)')).toBeOnTheScreen();
    expect(screen.getByText('BB7D7AAC')).toBeOnTheScreen();
    expect(screen.getByText('PEY-REF-1234')).toBeOnTheScreen();
    expect(screen.getByText('TXN-987654')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-receipt-items')).toBeOnTheScreen();
    expect(screen.getByText('1× Café americano')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('payment-receipt-back-button'));
    expect(screen.getByText('¡Pago recibido!')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('payment-received-accept-button'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
