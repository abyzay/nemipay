import React from 'react';
import { AppHeader, NemiPayLogo } from '@/components/ui';

export interface AuthHeaderProps {
  onBackPress: () => void;
  showLogo?: boolean;
}

export function AuthHeader({ onBackPress, showLogo = false }: AuthHeaderProps) {
  return (
    <AppHeader
      onBackPress={onBackPress}
      backTestID="auth-back-button"
      centerSlot={showLogo ? <NemiPayLogo size="md" testID="auth-logo" /> : undefined}
    />
  );
}
