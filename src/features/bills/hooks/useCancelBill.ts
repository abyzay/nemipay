import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billKeys } from '../queries/keys';
import { cancelBill } from '../services/billsService';
import type { CancelBillResponse } from '../types';

export function useCancelBill() {
  const queryClient = useQueryClient();

  return useMutation<CancelBillResponse, Error, string>({
    mutationFn: (billId) => cancelBill(billId),
    onSuccess: (_data, billId) => {
      void queryClient.invalidateQueries({ queryKey: billKeys.detail(billId) });
      void queryClient.invalidateQueries({ queryKey: billKeys.open() });
    },
  });
}
