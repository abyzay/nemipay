import React, { useState } from 'react';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { RegisterScreen } from '@/features/authentication/components';
import { useAppTheme } from '@/hooks';

export default function RegisterRoute() {
  const { tokens } = useAppTheme();
  const [feedback, setFeedback] = useState<{ message: string; isSuccess: boolean } | null>(null);

  return (
    <>
      <RegisterScreen
        onBackPress={() => router.back()}
        onSubmit={() => {
          setFeedback({
            message:
              'Registro validado correctamente. La conexión con el backend se integrará en la siguiente etapa.',
            isSuccess: true,
          });
        }}
        onTermsPress={() => {
          setFeedback({
            message: 'Términos y condiciones disponibles próximamente.',
            isSuccess: false,
          });
        }}
        onPrivacyPress={() => {
          setFeedback({
            message: 'Aviso de privacidad disponible próximamente.',
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
