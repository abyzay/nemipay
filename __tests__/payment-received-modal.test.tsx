import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { CollectQrScreen, PaymentReceivedModal } from '@/features/payments/components';
import { lightColors } from '@/theme';

jest.mock('@react-native-vector-icons/ionicons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) =>
      createElement(Text, { testID: testID ?? `ionicon-${name}` }, name),
  };
});

jest.mock('react-native-qrcode-svg', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  return function MockQRCode({ testID }: { testID?: string }) {
    return createElement(View, { testID: testID ?? 'mock-qr-code' });
  };
});

jest.mock('react-native-confetti-cannon', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  return function MockConfettiCannon({ colors, testID }: { colors?: string[]; testID?: string }) {
    return createElement(View, {
      testID: testID ?? 'mock-confetti',
      accessibilityHint: (colors ?? []).join('|'),
    });
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

describe('PaymentReceivedModal y prueba en Cobro rápido', () => {
  it('renderiza confeti con colores del tema, ícono de confirmación, monto, hora y botón Aceptar', async () => {
    const onAccept = jest.fn();

    await renderWithProviders(
      <PaymentReceivedModal
        visible
        amountCents={25000}
        timeLabel="10:24 a.m."
        onAccept={onAccept}
      />
    );

    expect(screen.getByTestId('payment-received-modal')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-received-check-icon')).toBeOnTheScreen();
    expect(screen.getByText('¡Pago recibido!')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-received-amount')).toHaveTextContent('$250.00');
    expect(screen.getByTestId('payment-received-time')).toHaveTextContent('10:24 a.m.');

    const confetti = screen.getByTestId('payment-received-confetti');
    expect(confetti).toBeOnTheScreen();
    expect(confetti.props.accessibilityHint).toContain(lightColors.primary);
    expect(confetti.props.accessibilityHint).toContain(lightColors.warning);
    expect(confetti.props.accessibilityHint).toContain(lightColors.success);

    await fireEvent.press(screen.getByTestId('payment-received-accept-button'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('abre y cierra el modal de prueba desde Cobro rápido debajo de Volver al panel', async () => {
    await renderWithProviders(<CollectQrScreen initialMode="dynamic" onBackPress={jest.fn()} />);

    expect(screen.getByTestId('collect-done-button')).toBeOnTheScreen();
    expect(screen.getByTestId('collect-test-payment-modal-button')).toBeOnTheScreen();
    expect(screen.queryByTestId('payment-received-modal')).toBeNull();

    await fireEvent.changeText(screen.getByTestId('collect-amount-input'), '320.50');
    await fireEvent.press(screen.getByTestId('collect-test-payment-modal-button'));

    expect(screen.getByTestId('payment-received-modal')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-received-amount')).toHaveTextContent('$320.50');
    expect(screen.getByTestId('payment-received-confetti')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('payment-received-accept-button'));
    expect(screen.queryByTestId('payment-received-modal')).toBeNull();
  });
});
