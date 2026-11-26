import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billKeys } from '../queries/keys';
import { createShareCharge } from '../services/billsService';
import type { CreateShareChargeInput, CreateShareChargeResponse } from '../types';

export interface CreateShareChargeVariables {
  input: CreateShareChargeInput;
  idempotencyKey: string;
}

export function useShareCharge() {
  const queryClient = useQueryClient();

  return useMutation<CreateShareChargeResponse, Error, CreateShareChargeVariables>({
    mutationFn: ({ input, idempotencyKey }) => createShareCharge(input, idempotencyKey),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: billKeys.detail(variables.input.billId) });
    },
  });
}
