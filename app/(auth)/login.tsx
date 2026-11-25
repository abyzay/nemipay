import React, { useState } from 'react';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { LoginScreen } from '@/features/authentication/components';
import type { LoginFormValues } from '@/features/authentication/schemas';
import { signInWithEmailPassword } from '@/features/authentication/services';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';

export default function LoginRoute() {
  const { tokens } = useAppTheme();
  const setAuthenticatedUser = useUiStore((state) => state.setAuthenticatedUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const handleLoginSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const { user } = await signInWithEmailPassword(values.identifier, values.password);
      setAuthenticatedUser(user);
      router.replace('/(tabs)');
    } catch (error) {
      setFeedback({
        message:
          error instanceof Error ? error.message : 'No pudimos iniciar sesión. Intenta de nuevo.',
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoginScreen
        onBackPress={() => router.back()}
        onSubmit={handleLoginSubmit}
        isSubmitting={isSubmitting}
        defaultIdentifier="demo@nemipay.mx"
        defaultPassword="12345678"
        onForgotPasswordPress={() => {
          setFeedback({
            message: 'Usa las credenciales de acceso de tu comercio para entrar.',
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
