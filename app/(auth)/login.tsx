import React, { useState } from 'react';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { LoginScreen } from '@/features/authentication/components';
import { useAppTheme } from '@/hooks';

export default function LoginRoute() {
  const { tokens } = useAppTheme();
  const [feedback, setFeedback] = useState<{ message: string; isSuccess: boolean } | null>(null);

  return (
    <>
      <LoginScreen
        onBackPress={() => router.back()}
        onSubmit={() => {
          setFeedback({
            message:
              'Datos validados correctamente. La conexión con el backend se integrará en la siguiente etapa.',
            isSuccess: true,
          });
        }}
        onForgotPasswordPress={() => {
          setFeedback({
            message: 'La recuperación de contraseña estará disponible al conectar el backend.',
            isSuccess: false,
          });
        }}
      />

      <Snackbar
        visible={feedback !== null}
        onDismiss={() => setFeedback(null)}
        duration={3000}
        style={{
          backgroundColor: feedback?.isSuccess ? tokens.colors.success : tokens.colors.primaryDark,
        }}
      >
        {feedback?.message ?? ''}
      </Snackbar>
    </>
  );
}
