import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentKeys } from '@/features/payments/queries/keys';
import {
  archiveCategory,
  createCategory,
  fetchActiveCategories,
  updateCategory,
} from '../services/categoriesService';
import type { PosCategory, PosCategoryDraft } from '../types';

export function useCategoriesQuery(enabled = true) {
  return useQuery<PosCategory[], Error>({
    queryKey: paymentKeys.categories(),
    queryFn: fetchActiveCategories,
    enabled,
  });
}

export function useCreateCategoryMutation(merchantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<PosCategory, Error, PosCategoryDraft>({
    retry: false,
    mutationFn: (draft) => {
      if (!merchantId) {
        return Promise.reject(new Error('Sesión requerida.'));
      }
      return createCategory(merchantId, draft);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.categories() });
    },
  });
}

export function useUpdateCategoryMutation(merchantId?: string) {
  const queryClient = useQueryClient();
  return useMutation<PosCategory, Error, { categoryId: string; draft: PosCategoryDraft }>({
    retry: false,
    mutationFn: ({ categoryId, draft }) => updateCategory(categoryId, draft, merchantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.categories() });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.products() });
    },
  });
}

export function useArchiveCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    retry: false,
    mutationFn: (categoryId) => archiveCategory(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.categories() });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.products() });
    },
  });
}
