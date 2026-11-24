import React from 'react';
import { AppHeader, NemiPayLogo } from '@/components/ui';

export interface AuthHeaderProps {
  onBackPress: () => void;
}

export function AuthHeader({ onBackPress }: AuthHeaderProps) {
  return (
    <AppHeader
      onBackPress={onBackPress}
      backTestID="auth-back-button"
      centerSlot={<NemiPayLogo size="md" testID="auth-logo" />}
    />
  );
}
