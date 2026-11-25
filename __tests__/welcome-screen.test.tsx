import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { WelcomeScreen } from '@/features/authentication/components';

jest.mock('@react-native-vector-icons/ionicons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) =>
      createElement(Text, { testID: testID ?? `ionicon-${name}` }, name),
  };
});

describe('Pantalla de bienvenida (WelcomeScreen)', () => {
  it('renderiza la marca, carrusel de bienvenida, indicadores y botones Comenzar e Iniciar sesión', async () => {
    const onLoginPress = jest.fn();
    const onCreateAccountPress = jest.fn();

    await render(
      <AppProviders
        client={createQueryClient()}
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <WelcomeScreen onLoginPress={onLoginPress} onCreateAccountPress={onCreateAccountPress} />
      </AppProviders>
    );

    expect(screen.getByTestId('welcome-logo')).toBeOnTheScreen();
    expect(screen.getByText('NemiPay')).toBeOnTheScreen();
    expect(screen.getByText('Cobra, recibe y\nhaz crecer tu negocio')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Ilustración de cobro con código QR de NemiPay')
    ).toBeOnTheScreen();

    expect(screen.getByTestId('welcome-dot-0').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('welcome-dot-1').props.accessibilityState).toEqual({
      selected: false,
    });
    expect(screen.getByTestId('welcome-dot-2').props.accessibilityState).toEqual({
      selected: false,
    });

    expect(screen.getByText('Comenzar')).toBeOnTheScreen();
    expect(screen.getByText('Iniciar sesión')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('welcome-dot-1'));
    expect(screen.getByTestId('welcome-dot-1').props.accessibilityState).toEqual({
      selected: true,
    });

    await fireEvent.press(screen.getByTestId('welcome-register-button'));
    await fireEvent.press(screen.getByTestId('welcome-login-button'));

    expect(onCreateAccountPress).toHaveBeenCalledTimes(1);
    expect(onLoginPress).toHaveBeenCalledTimes(1);
  });
});
