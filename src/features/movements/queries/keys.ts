export const movementKeys = {
  all: ['movements'] as const,
  lists: () => [...movementKeys.all, 'list'] as const,
  list: (filters?: Record<string, string | number | boolean | undefined>) =>
    [...movementKeys.lists(), filters ?? {}] as const,
  detail: (movementId: string) => [...movementKeys.all, 'detail', movementId] as const,
} as const;
