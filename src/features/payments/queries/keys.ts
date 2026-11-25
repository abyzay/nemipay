export const paymentKeys = {
  all: ['payments'] as const,
  charges: () => [...paymentKeys.all, 'charges'] as const,
  charge: (chargeId: string) => [...paymentKeys.charges(), chargeId] as const,
  chargesToday: () => [...paymentKeys.all, 'today'] as const,
  dailySummary: () => [...paymentKeys.all, 'daily-summary'] as const,
  products: () => ['products'] as const,
  merchant: (userId: string) => ['merchant', userId] as const,
} as const;
