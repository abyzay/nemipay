import React from 'react';
import { AppBadge, type AppBadgeVariant, type AppIconName } from '@/components/ui';

export type PaymentStatusKind = 'confirmed' | 'pending' | 'failed';

export interface PaymentStatusProps {
  status: PaymentStatusKind;
  label?: string;
  testID?: string;
}

const STATUS_CONFIG: Record<
  PaymentStatusKind,
  { defaultLabel: string; variant: AppBadgeVariant; icon: AppIconName }
> = {
  confirmed: {
    defaultLabel: 'Confirmado',
    variant: 'success',
    icon: 'circle-check',
  },
  pending: {
    defaultLabel: 'Pendiente',
    variant: 'warning',
    icon: 'clock',
  },
  failed: {
    defaultLabel: 'Rechazado',
    variant: 'error',
    icon: 'circle-alert',
  },
};

export function PaymentStatus({ status, label, testID }: PaymentStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <AppBadge
      label={label ?? config.defaultLabel}
      variant={config.variant}
      icon={config.icon}
      testID={testID}
    />
  );
}
