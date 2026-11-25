import { supabase } from '@/services/supabase';
import type { TodayMovement } from '../types';

function formatMexicoCityTime(isoDate: string): string {
  const date = new Date(isoDate);
  try {
    return new Intl.DateTimeFormat('es-MX', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Mexico_City',
    }).format(date);
  } catch {
    const hours24 = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = hours24 >= 12 ? 'p.m.' : 'a.m.';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12}:${minutes} ${period}`;
  }
}

export async function fetchChargesToday(): Promise<TodayMovement[]> {
  const { data, error } = await supabase.rpc('charges_today');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    concept: row.concept,
    amountCents: row.amount_cents,
    currency: 'MXN',
    timeLabel: formatMexicoCityTime(row.paid_at ?? row.created_at),
    status: row.status,
    paidAfterExpiry: row.paid_after_expiry,
  }));
}
