import React, { useState } from 'react';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { WelcomeScreen } from '@/features/authentication/components';
import { useAppTheme } from '@/hooks';

export default function WelcomeRoute() {
  const { tokens } = useAppTheme();
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <>
      <WelcomeScreen
        onLoginPress={() => router.push('/(auth)/login')}
        onCreateAccountPress={() => router.push('/(auth)/register')}
        onNotificationsPress={() => setNotice('Centro de notificaciones disponible próximamente.')}
        onTermsPress={() => setNotice('Términos y condiciones disponibles próximamente.')}
        onPrivacyPress={() => setNotice('Aviso de privacidad disponible próximamente.')}
      />

      <Snackbar
        visible={notice !== null}
        onDismiss={() => setNotice(null)}
        duration={2500}
        style={{ backgroundColor: tokens.colors.primaryDark }}
      >
        {notice ?? ''}
      </Snackbar>
    </>
  );
}
