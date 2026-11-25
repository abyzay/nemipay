import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { PaymentReceivedModal } from '@/features/payments/components';

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

describe('PaymentReceivedModal (pantalla verde de confirmación)', () => {
  it('renderiza el fondo verde completo, ícono check, monto, hora y botón Listo', async () => {
    const onAccept = jest.fn();

    await renderWithProviders(
      <PaymentReceivedModal
        visible
        amountCents={25000}
        timeLabel="10:24 a.m."
        concept="Cobro NemiPay"
        onAccept={onAccept}
      />
    );

    expect(screen.getByTestId('payment-received-modal')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-received-check-icon')).toBeOnTheScreen();
    expect(screen.getByText('¡Pago recibido!')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-received-amount')).toHaveTextContent('$250.00');
    expect(screen.getByTestId('payment-received-time')).toHaveTextContent(
      'Cobro NemiPay · 10:24 a.m.'
    );

    await fireEvent.press(screen.getByTestId('payment-received-accept-button'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
