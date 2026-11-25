import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { LoginScreen, RegisterScreen } from '@/features/authentication/components';
import { authenticateWithMockJson } from '@/features/authentication/services';
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
  it('muestra errores de validación en color oficial cuando faltan datos o el formato es inválido', async () => {
    const onBackPress = jest.fn();
    const onSubmit = jest.fn();

    await renderWithProviders(<LoginScreen onBackPress={onBackPress} onSubmit={onSubmit} />);

    expect(screen.getByTestId('login-illustration')).toBeOnTheScreen();
    expect(screen.getByLabelText('Comerciante de NemiPay dando la bienvenida')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('login-identifier-error')).toHaveTextContent(
        'Ingresa tu celular o correo electrónico.'
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
        'Ingresa un correo electrónico válido o un celular de 10 dígitos.'
      );
      expect(screen.getByTestId('login-password-error')).toHaveTextContent(
        'La contraseña debe tener al menos 8 caracteres.'
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('alterna visibilidad de contraseña y envía datos válidos (correo o celular)', async () => {
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

    await fireEvent.changeText(screen.getByTestId('login-identifier-input'), '5512345678');
    await fireEvent.changeText(screen.getByTestId('login-password-input'), 'NemiPay2026');
    await fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          identifier: '5512345678',
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

  it('permite iniciar sesión con el usuario demo abyzay y contraseña 12345678 desde JSON', async () => {
    const onBackPress = jest.fn();
    const onSubmit = jest.fn();

    await renderWithProviders(<LoginScreen onBackPress={onBackPress} onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByTestId('login-identifier-input'), 'abyzay');
    await fireEvent.changeText(screen.getByTestId('login-password-input'), '12345678');
    await fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          identifier: 'abyzay',
          password: '12345678',
        },
        expect.anything()
      );
    });

    const validResult = authenticateWithMockJson('abyzay', '12345678');
    expect(validResult.success).toBe(true);
    if (validResult.success) {
      expect(validResult.user.username).toBe('abyzay');
    }

    const invalidResult = authenticateWithMockJson('abyzay', 'wrongpass');
    expect(invalidResult.success).toBe(false);
  });
});

describe('RegisterScreen con validación Zod', () => {
  it('valida todos los campos y exige aceptar Términos y Aviso de privacidad', async () => {
    const onBackPress = jest.fn();
    const onSubmit = jest.fn();

    await renderWithProviders(<RegisterScreen onBackPress={onBackPress} onSubmit={onSubmit} />);

    expect(screen.getByTestId('register-security-lock-icon')).toBeOnTheScreen();
    expect(screen.getByText('Tus datos están protegidos.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('register-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('register-fullname-error')).toHaveTextContent(
        'Ingresa tu nombre completo.'
      );
      expect(screen.getByTestId('register-phone-error')).toHaveTextContent(
        'Ingresa tu número de celular.'
      );
      expect(screen.getByTestId('register-email-error')).toHaveTextContent(
        'Ingresa tu correo electrónico.'
      );
      expect(screen.getByTestId('register-password-error')).toHaveTextContent(
        'Crea una contraseña.'
      );
      expect(screen.getByTestId('register-terms-error')).toHaveTextContent(
        'Debes aceptar los Términos y el Aviso de privacidad.'
      );
    });

    expect(screen.getByTestId('register-terms-error')).toHaveStyle({
      color: lightColors.error,
    });
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('register-fullname-input'), 'Ana');
    await fireEvent.changeText(screen.getByTestId('register-phone-input'), '55123');
    await fireEvent.changeText(screen.getByTestId('register-email-input'), 'correo-mal');
    await fireEvent.changeText(screen.getByTestId('register-password-input'), 'abcdefgh');
    await fireEvent.press(screen.getByTestId('register-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('register-fullname-error')).toHaveTextContent(
        'Ingresa tu nombre y apellido.'
      );
      expect(screen.getByTestId('register-phone-error')).toHaveTextContent(
        'Ingresa un número de celular válido de 10 dígitos.'
      );
      expect(screen.getByTestId('register-email-error')).toHaveTextContent(
        'Ingresa un correo electrónico válido.'
      );
      expect(screen.getByTestId('register-password-error')).toHaveTextContent(
        'Incluye al menos una letra y un número.'
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía el formulario cuando todos los campos y el checkbox son válidos', async () => {
    const onBackPress = jest.fn();
    const onSubmit = jest.fn();
    const onGooglePress = jest.fn();
    const onTermsPress = jest.fn();
    const onPrivacyPress = jest.fn();

    await renderWithProviders(
      <RegisterScreen
        onBackPress={onBackPress}
        onSubmit={onSubmit}
        onGooglePress={onGooglePress}
        onTermsPress={onTermsPress}
        onPrivacyPress={onPrivacyPress}
      />
    );

    expect(screen.getByTestId('register-illustration')).toBeOnTheScreen();
    expect(screen.getByText('Crear tu cuenta')).toBeOnTheScreen();
    expect(screen.getByText('Es rápido y seguro')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('register-fullname-input'), 'Sofía López');
    await fireEvent.changeText(screen.getByTestId('register-phone-input'), '55 1234 5678');
    await fireEvent.changeText(screen.getByTestId('register-email-input'), 'sofia@taqueria.mx');
    await fireEvent.changeText(screen.getByTestId('register-password-input'), 'Seguro2026');
    await fireEvent.press(screen.getByTestId('register-terms-checkbox'));
    await fireEvent.press(screen.getByTestId('register-submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          fullName: 'Sofía López',
          phone: '55 1234 5678',
          email: 'sofia@taqueria.mx',
          password: 'Seguro2026',
          acceptTerms: true,
        },
        expect.anything()
      );
    });

    await fireEvent.press(screen.getByTestId('register-google-button'));
    await fireEvent.press(screen.getByText('Términos'));
    await fireEvent.press(screen.getByText('Aviso de privacidad.'));
    await fireEvent.press(screen.getByTestId('auth-back-button'));

    expect(onGooglePress).toHaveBeenCalledTimes(1);
    expect(onTermsPress).toHaveBeenCalledTimes(1);
    expect(onPrivacyPress).toHaveBeenCalledTimes(1);
    expect(onBackPress).toHaveBeenCalledTimes(1);
  });
});
