import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import type { Database } from '@/types/database';
import { paymentKeys } from '../queries/keys';
import { checkCharge, fetchChargeById, mapDbChargeRowToCharge } from '../services/chargesService';
import { TERMINAL_OR_STOP_STATUSES, type Charge } from '../types';

type DbChargeRow = Database['public']['Tables']['charges']['Row'];

const CHECK_FALLBACK_INTERVAL_MS = 8_000;

export function useChargeLive(chargeId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<Charge, Error>({
    queryKey: paymentKeys.charge(chargeId ?? ''),
    queryFn: () => fetchChargeById(chargeId!),
    enabled: Boolean(chargeId),
    staleTime: 0,
  });

  const status = query.data?.status;
  const isStopped = status !== undefined && TERMINAL_OR_STOP_STATUSES.has(status);

  useEffect(() => {
    if (!chargeId || isStopped) {
      return;
    }

    const syncFromCheck = () => {
      void checkCharge(chargeId)
        .then((updated) => {
          queryClient.setQueryData(paymentKeys.charge(chargeId), updated);
          if (updated.status === 'CONFIRMED') {
            void queryClient.invalidateQueries({ queryKey: paymentKeys.dailySummary() });
            void queryClient.invalidateQueries({ queryKey: paymentKeys.chargesToday() });
          }
        })
        .catch(() => {
          // Respaldo silencioso; Realtime o el siguiente ciclo reintentan
        });
    };

    const channel = supabase
      .channel(`charge-live-${chargeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'charges',
          filter: `id=eq.${chargeId}`,
        },
        (payload) => {
          const updated = mapDbChargeRowToCharge(payload.new as DbChargeRow);
          queryClient.setQueryData(paymentKeys.charge(chargeId), updated);
          if (updated.status === 'CONFIRMED') {
            void queryClient.invalidateQueries({ queryKey: paymentKeys.dailySummary() });
            void queryClient.invalidateQueries({ queryKey: paymentKeys.chargesToday() });
          }
        }
      )
      .subscribe();

    const intervalId = setInterval(syncFromCheck, CHECK_FALLBACK_INTERVAL_MS);

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void queryClient.invalidateQueries({ queryKey: paymentKeys.charge(chargeId) });
        syncFromCheck();
      }
    });

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void queryClient.invalidateQueries({ queryKey: paymentKeys.charge(chargeId) });
        syncFromCheck();
      }
    };

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      clearInterval(intervalId);
      appStateSub.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
      void supabase.removeChannel(channel);
    };
  }, [chargeId, isStopped, queryClient]);

  return query;
}
