export const reportKeys = {
  all: ['reports'] as const,
  summaries: () => [...reportKeys.all, 'summary'] as const,
  summary: (range: string) => [...reportKeys.summaries(), range] as const,
} as const;
