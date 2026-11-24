import React from 'react';
import { TransactionItem } from '@/components/financial';
import type { ReceivedMovement } from '../types';

export interface MovementRowProps {
  movement: ReceivedMovement;
  compact?: boolean;
  showDivider?: boolean;
  testID?: string;
}

export function MovementRow({
  movement,
  compact = false,
  showDivider = false,
  testID,
}: MovementRowProps) {
  return (
    <TransactionItem
      title={movement.concept}
      subtitle={compact ? movement.timeLabel : `${movement.payerReference} · ${movement.timeLabel}`}
      amountCents={movement.amountCents}
      currency={movement.currency}
      direction="received"
      statusLabel="Recibido"
      icon={movement.iconName}
      compact={compact}
      showDivider={showDivider}
      testID={testID}
    />
  );
}
