import type { ReportRange } from '../types';

export const reportKeys = {
  all: ['reports'] as const,
  sales: (range: ReportRange) => [...reportKeys.all, 'sales', range] as const,
} as const;
