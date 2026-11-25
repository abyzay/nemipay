import React, { useState } from 'react';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { LoginScreen } from '@/features/authentication/components';
import type { LoginFormValues } from '@/features/authentication/schemas';
import { authenticateWithMockJson } from '@/features/authentication/services';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';

export default function LoginRoute() {
  const { tokens } = useAppTheme();
  const setAuthenticatedUser = useUiStore((state) => state.setAuthenticatedUser);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const handleLoginSubmit = (values: LoginFormValues) => {
    const result = authenticateWithMockJson(values.identifier, values.password);

    if (!result.success) {
      setFeedback({
        message: result.errorMessage,
        isError: true,
      });
      return;
    }

    setAuthenticatedUser(result.user);
    router.replace('/(tabs)');
  };

  return (
    <>
      <LoginScreen
        onBackPress={() => router.back()}
        onSubmit={handleLoginSubmit}
        onForgotPasswordPress={() => {
          setFeedback({
            message: 'Acceso temporal de prueba: usuario abyzay / contraseña 12345678.',
            isError: false,
          });
        }}
        onGooglePress={() => {
          setFeedback({
            message: 'Inicio de sesión con Google disponible próximamente.',
            isError: false,
          });
        }}
        onRegisterPress={() => router.replace('/(auth)/register')}
      />

      <Snackbar
        visible={feedback !== null}
        onDismiss={() => setFeedback(null)}
        duration={3500}
        style={{
          backgroundColor: feedback?.isError ? tokens.colors.error : tokens.colors.primaryDark,
        }}
      >
        {feedback?.message ?? ''}
      </Snackbar>
    </>
  );
}
