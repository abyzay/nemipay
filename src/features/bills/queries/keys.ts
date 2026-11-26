export const billKeys = {
  all: ['bills'] as const,
  open: () => [...billKeys.all, 'open'] as const,
  detail: (billId: string) => [...billKeys.all, 'detail', billId] as const,
} as const;
