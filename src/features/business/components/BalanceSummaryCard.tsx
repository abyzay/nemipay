import React from 'react';
import { BalanceCard } from '@/components/financial';
import type { CurrencyCode } from '@/types/common';

export interface BalanceSummaryCardProps {
  todayReceivedCents: number;
  todayCount: number;
  currency: CurrencyCode;
}

export function BalanceSummaryCard({
  todayReceivedCents,
  todayCount,
  currency,
}: BalanceSummaryCardProps) {
  return (
    <BalanceCard
      label="Cobros de hoy"
      amountCents={todayReceivedCents}
      currency={currency}
      badgeText={`${todayCount} recibidos`}
      subtitle="Disponible al instante vía CoDi"
      icon="wallet"
      testID="dashboard-balance-card"
      amountTestID="dashboard-balance-amount"
    />
  );
}
