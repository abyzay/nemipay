import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentKeys } from '../queries/keys';
import { createCharge } from '../services/chargesService';
import type { Charge, CreateChargeInput } from '../types';

export interface CreateChargeVariables {
  input: CreateChargeInput;
  idempotencyKey: string;
}

export function useCreateCharge() {
  const queryClient = useQueryClient();

  return useMutation<Charge, Error, CreateChargeVariables>({
    retry: false,
    mutationFn: ({ input, idempotencyKey }) => createCharge(input, idempotencyKey),
    onSuccess: (charge) => {
      queryClient.setQueryData(paymentKeys.charge(charge.id), charge);
      void queryClient.invalidateQueries({ queryKey: [...paymentKeys.all, 'movements'] });
    },
  });
}
