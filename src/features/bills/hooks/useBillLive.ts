import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentKeys } from '@/features/payments/queries/keys';
import { checkCharge } from '@/features/payments/services/chargesService';
import { supabase } from '@/services/supabase';
import { billKeys } from '../queries/keys';
import { fetchBillDetail } from '../services/billsService';
import type { BillDetail } from '../types';

const DETAIL_FALLBACK_INTERVAL_MS = 10_000;
const ACTIVE_CHECK_INTERVAL_MS = 8_000;

export function useBillLive(billId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<BillDetail, Error>({
    queryKey: billKeys.detail(billId ?? ''),
    queryFn: () => fetchBillDetail(billId!),
    enabled: Boolean(billId),
    staleTime: 0,
  });

  const billStatus = query.data?.bill.status;
  const isTerminal =
    billStatus === 'PAID' || billStatus === 'CANCELLED' || billStatus === 'EXPIRED';

  useEffect(() => {
    if (!billId || isTerminal) {
      return;
    }

    const refreshDetail = () => {
      void queryClient.invalidateQueries({ queryKey: billKeys.detail(billId) });
      void queryClient.invalidateQueries({ queryKey: billKeys.open() });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.dailySummary() });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.recentMovements() });
    };

    const channelSuffix = Math.random().toString(36).slice(2, 8);
    const channel = supabase
      .channel(`bill-live-${billId}-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills',
          filter: `id=eq.${billId}`,
        },
        () => {
          refreshDetail();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'charges',
          filter: `bill_id=eq.${billId}`,
        },
        () => {
          refreshDetail();
        }
      )
      .subscribe();

    const detailIntervalId = setInterval(refreshDetail, DETAIL_FALLBACK_INTERVAL_MS);

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshDetail();
      }
    });

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshDetail();
      }
    };

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      clearInterval(detailIntervalId);
      appStateSub.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
      void supabase.removeChannel(channel);
    };
  }, [billId, isTerminal, queryClient]);

  return query;
}

export function useActiveSharePolling(
  billId: string | undefined,
  activeChargeId: string | null,
  isTerminal: boolean
) {
  const queryClient = useQueryClient();

  // El front solo consulta check-charge para la diapositiva activa (~8 s); el Cron cubre las demás
  useEffect(() => {
    if (!billId || !activeChargeId || isTerminal) {
      return;
    }

    const pollActive = () => {
      void checkCharge(activeChargeId)
        .then((updated) => {
          if (updated.status !== 'AWAITING_PAYMENT') {
            void queryClient.invalidateQueries({ queryKey: billKeys.detail(billId) });
            void queryClient.invalidateQueries({ queryKey: billKeys.open() });
            if (updated.status === 'CONFIRMED') {
              void queryClient.invalidateQueries({ queryKey: paymentKeys.dailySummary() });
              void queryClient.invalidateQueries({ queryKey: paymentKeys.recentMovements() });
            }
          }
        })
        .catch(() => {
          // Respaldo silencioso
        });
    };

    const intervalId = setInterval(pollActive, ACTIVE_CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [activeChargeId, billId, isTerminal, queryClient]);
}
