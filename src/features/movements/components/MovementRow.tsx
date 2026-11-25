import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TransactionItem } from '@/components/financial';
import type { AppIconName } from '@/components/ui';
import type { MovementStatus, TodayMovement } from '../types';

export interface MovementRowProps {
  movement: TodayMovement;
  showDivider?: boolean;
  testID?: string;
}

const STATUS_META: Record<MovementStatus, { label: string; icon: AppIconName }> = {
  CONFIRMED: { label: 'Pagado', icon: 'circle-check' },
  AWAITING_PAYMENT: { label: 'Esperando pago', icon: 'clock' },
  CREATING: { label: 'Creando QR', icon: 'clock' },
  EXPIRED: { label: 'Expirado', icon: 'clock' },
  CANCELLED: { label: 'Cancelado', icon: 'circle-alert' },
  FAILED: { label: 'Fallido', icon: 'circle-alert' },
  UNDER_REVIEW: { label: 'En revisión', icon: 'circle-alert' },
};

export function MovementRow({ movement, showDivider = false, testID }: MovementRowProps) {
  const isConfirmed = movement.status === 'CONFIRMED';
  const meta = STATUS_META[movement.status];
  const statusLabel = isConfirmed && movement.paidAfterExpiry ? 'Pagado (tardío)' : meta.label;

  return (
    <View style={!isConfirmed ? styles.dimmed : undefined} testID={testID}>
      <TransactionItem
        title={movement.concept}
        subtitle={movement.timeLabel}
        amountCents={movement.amountCents}
        currency={movement.currency}
        direction={isConfirmed ? 'received' : 'sent'}
        statusLabel={statusLabel}
        icon={meta.icon}
        showDivider={showDivider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dimmed: {
    opacity: 0.55,
  },
});
