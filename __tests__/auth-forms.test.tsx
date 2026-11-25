import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { LoginScreen, RegisterScreen } from '@/features/authentication/components';
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

describe('LoginScreen con validación Zod', () => {
  it('muestra errores de validación cuando faltan datos o el correo es inválido', async () => {
    const onBackPress = jest.fn();
    const onSubmit = jest.fn();

    await renderWithProviders(<LoginScreen onBackPress={onBackPress} onSubmit={onSubmit} />);

    expect(screen.getByTestId('login-illustration')).toBeOnTheScreen();
    expect(screen.getByLabelText('Comerciante de NemiPay dando la bienvenida')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('login-identifier-error')).toHaveTextContent(
        'Ingresa tu correo electrónico.'
      );
      expect(screen.getByTestId('login-password-error')).toHaveTextContent(
        'Ingresa tu contraseña.'
      );
    });

    expect(screen.getByTestId('login-identifier-error')).toHaveStyle({
      color: lightColors.error,
    });
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('login-identifier-input'), 'dato-invalido');
    await fireEvent.changeText(screen.getByTestId('login-password-input'), '123');
    await fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('login-identifier-error')).toHaveTextContent(
        'Ingresa un correo electrónico válido.'
      );
      expect(screen.getByTestId('login-password-error')).toHaveTextContent(
        'La contraseña debe tener al menos 8 caracteres.'
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('alterna visibilidad de contraseña, envía datos válidos y conserva enlaces de login', async () => {
    const onBackPress = jest.fn();
    const onSubmit = jest.fn();
    const onForgotPasswordPress = jest.fn();
    const onGooglePress = jest.fn();
    const onRegisterPress = jest.fn();

    await renderWithProviders(
      <LoginScreen
        onBackPress={onBackPress}
        onSubmit={onSubmit}
        onForgotPasswordPress={onForgotPasswordPress}
        onGooglePress={onGooglePress}
        onRegisterPress={onRegisterPress}
      />
    );

    expect(screen.getByText('Inicia sesión')).toBeOnTheScreen();
    expect(screen.getByText('Bienvenido de nuevo')).toBeOnTheScreen();

    const passwordInput = screen.getByTestId('login-password-input');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByLabelText('Mostrar contraseña'));
    expect(screen.getByTestId('login-password-input').props.secureTextEntry).toBe(false);

    await fireEvent.changeText(screen.getByTestId('login-identifier-input'), 'demo@nemipay.mx');
    await fireEvent.changeText(screen.getByTestId('login-password-input'), 'NemiPay2026');
    await fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          identifier: 'demo@nemipay.mx',
          password: 'NemiPay2026',
        },
        expect.anything()
      );
    });

    await fireEvent.press(screen.getByTestId('auth-back-button'));
    await fireEvent.press(screen.getByTestId('login-forgot-password-button'));
    await fireEvent.press(screen.getByTestId('login-google-button'));
    await fireEvent.press(screen.getByTestId('login-register-link'));
    expect(onBackPress).toHaveBeenCalledTimes(1);
    expect(onForgotPasswordPress).toHaveBeenCalledTimes(1);
    expect(onGooglePress).toHaveBeenCalledTimes(1);
    expect(onRegisterPress).toHaveBeenCalledTimes(1);
  });
});

describe('RegisterScreen con validación Zod y botones deshabilitados', () => {
  it('muestra la pantalla completa de registro con sus campos y botones deshabilitados cuando registrationDisabled=true', async () => {
    const onBackPress = jest.fn();
    const onSubmit = jest.fn();
    const onGooglePress = jest.fn();

    await renderWithProviders(
      <RegisterScreen
        registrationDisabled
        onBackPress={onBackPress}
        onSubmit={onSubmit}
        onGooglePress={onGooglePress}
      />
    );

    expect(screen.getByTestId('register-illustration')).toBeOnTheScreen();
    expect(screen.getByText('Crear tu cuenta')).toBeOnTheScreen();
    expect(screen.getByText('Es rápido y seguro')).toBeOnTheScreen();
    expect(screen.getByTestId('register-fullname-input')).toBeOnTheScreen();
    expect(screen.getByTestId('register-phone-input')).toBeOnTheScreen();
    expect(screen.getByTestId('register-email-input')).toBeOnTheScreen();
    expect(screen.getByTestId('register-password-input')).toBeOnTheScreen();
    expect(screen.getByTestId('register-security-lock-icon')).toBeOnTheScreen();

    const submitButton = screen.getByTestId('register-submit-button');
    const googleButton = screen.getByTestId('register-google-button');
    expect(submitButton.props.accessibilityState).toMatchObject({ disabled: true });
    expect(googleButton.props.accessibilityState).toMatchObject({ disabled: true });

    await fireEvent.press(submitButton);
    await fireEvent.press(googleButton);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onGooglePress).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('auth-back-button'));
    expect(onBackPress).toHaveBeenCalledTimes(1);
  });

  it('valida los campos del formulario cuando el registro no está deshabilitado', async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<RegisterScreen onBackPress={jest.fn()} onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByTestId('register-fullname-input'), 'Sofía López');
    await fireEvent.changeText(screen.getByTestId('register-phone-input'), '55 1234 5678');
    await fireEvent.changeText(screen.getByTestId('register-email-input'), 'sofia@nemipay.mx');
    await fireEvent.changeText(screen.getByTestId('register-password-input'), 'Seguro2026');
    await fireEvent.press(screen.getByTestId('register-terms-checkbox'));
    await fireEvent.press(screen.getByTestId('register-submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          fullName: 'Sofía López',
          phone: '55 1234 5678',
          email: 'sofia@nemipay.mx',
          password: 'Seguro2026',
          acceptTerms: true,
        },
        expect.anything()
      );
    });
  });
});
