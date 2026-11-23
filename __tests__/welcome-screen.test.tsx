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
  it('renderiza la marca, textos principales, ilustración, botones y enlaces legales', async () => {
    const onLoginPress = jest.fn();
    const onCreateAccountPress = jest.fn();
    const onNotificationsPress = jest.fn();
    const onTermsPress = jest.fn();
    const onPrivacyPress = jest.fn();

    await render(
      <AppProviders
        client={createQueryClient()}
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <WelcomeScreen
          onLoginPress={onLoginPress}
          onCreateAccountPress={onCreateAccountPress}
          onNotificationsPress={onNotificationsPress}
          onTermsPress={onTermsPress}
          onPrivacyPress={onPrivacyPress}
        />
      </AppProviders>
    );

    expect(screen.getByText('NemiPay')).toBeOnTheScreen();
    expect(screen.getByText('Cobra fácil.\nPaga seguro.')).toBeOnTheScreen();
    expect(screen.getByText('Tu dinero y tus cobros QR,\nen un solo lugar.')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Ilustración de cobro con código QR de NemiPay')
    ).toBeOnTheScreen();
    expect(screen.getByText('Iniciar sesión')).toBeOnTheScreen();
    expect(screen.getByText('Crear cuenta')).toBeOnTheScreen();
    expect(screen.getByText('Términos')).toBeOnTheScreen();
    expect(screen.getByText('Aviso de privacidad.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('welcome-login-button'));
    await fireEvent.press(screen.getByTestId('welcome-register-button'));
    await fireEvent.press(screen.getByTestId('welcome-notifications-button'));
    await fireEvent.press(screen.getByText('Términos'));
    await fireEvent.press(screen.getByText('Aviso de privacidad.'));

    expect(onLoginPress).toHaveBeenCalledTimes(1);
    expect(onCreateAccountPress).toHaveBeenCalledTimes(1);
    expect(onNotificationsPress).toHaveBeenCalledTimes(1);
    expect(onTermsPress).toHaveBeenCalledTimes(1);
    expect(onPrivacyPress).toHaveBeenCalledTimes(1);
  });
});
