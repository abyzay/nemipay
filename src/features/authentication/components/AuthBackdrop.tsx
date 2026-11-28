import React from 'react';
import { ScreenBackdrop } from '@/components/layout';

export interface AuthBackdropProps {
  testID?: string;
}

/**
 * Fondo orgánico sutil en tonos lavanda del Design System para las pantallas de autenticación y perfil.
 */
export function AuthBackdrop({ testID }: AuthBackdropProps = {}) {
  return <ScreenBackdrop testID={testID} />;
}
