import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentKeys } from '@/features/payments/queries/keys';
import {
  archiveProduct,
  createProduct,
  createProductsBatch,
  fetchActiveProducts,
  updateProduct,
} from '../services/productsService';
import type { PosProduct, PosProductDraft } from '../types';

export function useProductsQuery(enabled = true) {
  return useQuery<PosProduct[], Error>({
    queryKey: paymentKeys.products(),
    queryFn: fetchActiveProducts,
    enabled,
  });
}

export function useCreateProductMutation(merchantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<PosProduct, Error, PosProductDraft>({
    retry: false,
    mutationFn: (draft) => {
      if (!merchantId) {
        return Promise.reject(new Error('Sesión requerida.'));
      }
      return createProduct(merchantId, draft);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.products() });
    },
  });
}

export function useCreateProductsBatchMutation(merchantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<PosProduct[], Error, readonly PosProductDraft[]>({
    retry: false,
    mutationFn: (drafts) => {
      if (!merchantId) {
        return Promise.reject(new Error('Sesión requerida.'));
      }
      return createProductsBatch(merchantId, drafts);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.products() });
    },
  });
}

export function useUpdateProductMutation(merchantId?: string) {
  const queryClient = useQueryClient();
  return useMutation<PosProduct, Error, { productId: string; draft: PosProductDraft }>({
    retry: false,
    mutationFn: ({ productId, draft }) => updateProduct(productId, draft, merchantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.products() });
    },
  });
}

export function useArchiveProductMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    retry: false,
    mutationFn: (productId) => archiveProduct(productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.products() });
    },
  });
}
