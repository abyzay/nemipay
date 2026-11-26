import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billKeys } from '../queries/keys';
import { createBill } from '../services/billsService';
import type { CreateBillInput, CreateBillResponse } from '../types';

export interface CreateBillVariables {
  input: CreateBillInput;
  idempotencyKey: string;
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation<CreateBillResponse, Error, CreateBillVariables>({
    mutationFn: ({ input, idempotencyKey }) => createBill(input, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billKeys.open() });
    },
  });
}
