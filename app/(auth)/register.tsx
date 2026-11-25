import React, { useState } from 'react';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { RegisterScreen } from '@/features/authentication/components';
import { useAppTheme } from '@/hooks';

export default function RegisterRoute() {
  const { tokens } = useAppTheme();
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  return (
    <>
      <RegisterScreen
        registrationDisabled
        onBackPress={() => router.back()}
        onSubmit={() => {
          setFeedback({
            message: 'El registro público está deshabilitado por el momento.',
            isError: false,
          });
        }}
        onGooglePress={() => {
          setFeedback({
            message: 'El registro público está deshabilitado por el momento.',
            isError: false,
          });
        }}
        onTermsPress={() => {
          setFeedback({
            message: 'Términos y condiciones disponibles próximamente.',
            isError: false,
          });
        }}
        onPrivacyPress={() => {
          setFeedback({
            message: 'Aviso de privacidad disponible próximamente.',
            isError: false,
          });
        }}
      />

      <Snackbar
        visible={feedback !== null}
        onDismiss={() => setFeedback(null)}
        duration={3000}
        style={{
          backgroundColor: feedback?.isError ? tokens.colors.error : tokens.colors.primaryDark,
        }}
      >
        {feedback?.message ?? ''}
      </Snackbar>
    </>
  );
}
