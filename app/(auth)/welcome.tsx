import React from 'react';
import { router } from 'expo-router';
import { WelcomeScreen } from '@/features/authentication/components';

export default function WelcomeRoute() {
  return (
    <WelcomeScreen
      onLoginPress={() => router.push('/(auth)/login')}
      onCreateAccountPress={() => router.push('/(auth)/register')}
    />
  );
}
