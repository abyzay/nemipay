import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { DashboardScreen } from '@/features/business/components';
import { lightColors } from '@/theme';

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

describe('DashboardScreen (Inicio)', () => {
  it('muestra saludo, resumen del día, botones exclusivos para recibir pagos y los últimos 3 movimientos', async () => {
    const onReceiveQrPress = jest.fn();
    const onQuickChargePress = jest.fn();
    const onBusinessQrPress = jest.fn();
    const onSeeAllMovementsPress = jest.fn();

    await renderWithProviders(
      <DashboardScreen
        onReceiveQrPress={onReceiveQrPress}
        onQuickChargePress={onQuickChargePress}
        onBusinessQrPress={onBusinessQrPress}
        onSeeAllMovementsPress={onSeeAllMovementsPress}
      />
    );

    expect(screen.getByTestId('dashboard-logo')).toBeOnTheScreen();
    expect(screen.getByText('Hola, Abyzay')).toBeOnTheScreen();
    expect(screen.getByText('Cobrar con QR')).toBeOnTheScreen();
    expect(screen.getByText('Cobro rápido')).toBeOnTheScreen();
    expect(screen.getByText('QR del negocio')).toBeOnTheScreen();
    expect(screen.getByText('Cobros de hoy')).toBeOnTheScreen();
    expect(screen.getByTestId('dashboard-balance-amount')).toHaveTextContent('$4,850.00');
    expect(screen.getByText('Actividad reciente')).toBeOnTheScreen();

    // Verifica que no existen acciones de enviar dinero ni pagar
    expect(screen.queryByText('Enviar dinero')).toBeNull();
    expect(screen.queryByText('Pagar con QR')).toBeNull();

    // Verifica que se muestran exactamente los 3 movimientos recientes desde JSON
    expect(screen.getByTestId('dashboard-movement-item-0')).toBeOnTheScreen();
    expect(screen.getByTestId('dashboard-movement-item-1')).toBeOnTheScreen();
    expect(screen.getByTestId('dashboard-movement-item-2')).toBeOnTheScreen();
    expect(screen.queryByTestId('dashboard-movement-item-3')).toBeNull();
    expect(screen.getByText('+$185.00')).toHaveStyle({ color: lightColors.success });

    await fireEvent.press(screen.getByTestId('dashboard-receive-qr-hero'));
    await fireEvent.press(screen.getByTestId('dashboard-quick-charge-button'));
    await fireEvent.press(screen.getByTestId('dashboard-business-qr-button'));
    await fireEvent.press(screen.getByTestId('dashboard-see-all-movements-button'));

    expect(onReceiveQrPress).toHaveBeenCalledTimes(1);
    expect(onQuickChargePress).toHaveBeenCalledTimes(1);
    expect(onBusinessQrPress).toHaveBeenCalledTimes(1);
    expect(onSeeAllMovementsPress).toHaveBeenCalledTimes(1);
  });

  it('abre y cierra el modal de avisos de cobro desde la campana', async () => {
    await renderWithProviders(
      <DashboardScreen
        onReceiveQrPress={jest.fn()}
        onQuickChargePress={jest.fn()}
        onBusinessQrPress={jest.fn()}
        onSeeAllMovementsPress={jest.fn()}
      />
    );

    await fireEvent.press(screen.getByTestId('dashboard-notifications-button'));
    expect(screen.getByTestId('dashboard-notifications-modal')).toBeOnTheScreen();
    expect(screen.getByText('Avisos de cobro')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('dashboard-notifications-close-button'));
    expect(screen.queryByTestId('dashboard-notifications-modal')).toBeNull();
  });
});
