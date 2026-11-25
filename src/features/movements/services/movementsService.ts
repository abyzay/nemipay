import { supabase } from '@/services/supabase';
import type { MovementFilter, MovementsPage, MovementStatus, TodayMovement } from '../types';

export const MOVEMENTS_PAGE_SIZE = 20;

const MEXICO_CITY_TZ = 'America/Mexico_City';

const SHORT_MONTHS_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

function getMexicoCityDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: MEXICO_CITY_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const year = Number(parts.find((p) => p.type === 'year')?.value ?? date.getFullYear());
    const month = Number(parts.find((p) => p.type === 'month')?.value ?? date.getMonth() + 1);
    const day = Number(parts.find((p) => p.type === 'day')?.value ?? date.getDate());
    return { year, month, day };
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }
}

function formatMexicoCityTime(date: Date): string {
  try {
    const formatted = new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: MEXICO_CITY_TZ,
    }).format(date);
    return formatted;
  } catch {
    const hours24 = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = hours24 >= 12 ? 'p.m.' : 'a.m.';
    const hours12 = (hours24 % 12 === 0 ? 12 : hours24 % 12).toString().padStart(2, '0');
    return `${hours12}:${minutes} ${period}`;
  }
}

export function formatMovementDateLabel(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timeLabel = formatMexicoCityTime(date);
  const target = getMexicoCityDateParts(date);
  const today = getMexicoCityDateParts(now);

  const targetUtcDay = Date.UTC(target.year, target.month - 1, target.day);
  const todayUtcDay = Date.UTC(today.year, today.month - 1, today.day);
  const dayDiff = Math.round((todayUtcDay - targetUtcDay) / 86_400_000);

  if (dayDiff === 0) {
    return `Hoy, ${timeLabel}`;
  }
  if (dayDiff === 1) {
    return `Ayer, ${timeLabel}`;
  }

  const dayStr = String(target.day).padStart(2, '0');
  const monthStr = SHORT_MONTHS_ES[target.month - 1] ?? '';
  return `${dayStr} ${monthStr}, ${timeLabel}`;
}

export function formatReceiptDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return '';
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const parts = getMexicoCityDateParts(date);
  const dayStr = String(parts.day).padStart(2, '0');
  const monthStr = SHORT_MONTHS_ES[parts.month - 1] ?? '';
  const timeLabel = formatMexicoCityTime(date);
  return `${dayStr} ${monthStr} ${parts.year}, ${timeLabel}`;
}

const PENDING_STATUSES: MovementStatus[] = ['AWAITING_PAYMENT', 'CREATING'];
const OTHER_STATUSES: MovementStatus[] = ['EXPIRED', 'CANCELLED', 'FAILED', 'UNDER_REVIEW'];

export interface FetchMovementsPageParams {
  page?: number;
  pageSize?: number;
  filter?: MovementFilter;
  search?: string;
}

export async function fetchMovementsPage({
  page = 0,
  pageSize = MOVEMENTS_PAGE_SIZE,
  filter = 'all',
  search = '',
}: FetchMovementsPageParams = {}): Promise<MovementsPage> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('charges')
    .select('id, concept, amount_cents, currency, status, paid_after_expiry, paid_at, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filter === 'received') {
    query = query.eq('status', 'CONFIRMED');
  } else if (filter === 'pending') {
    query = query.in('status', PENDING_STATUSES);
  } else if (filter === 'other') {
    query = query.in('status', OTHER_STATUSES);
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch.length > 0) {
    query = query.ilike('concept', `%${trimmedSearch}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const items: TodayMovement[] = rows.map((row) => {
    const timestamp = row.paid_at ?? row.created_at;
    return {
      id: row.id,
      concept: row.concept,
      amountCents: row.amount_cents,
      currency: row.currency === 'MXN' ? 'MXN' : 'MXN',
      timeLabel: formatMovementDateLabel(timestamp),
      status: row.status,
      paidAfterExpiry: row.paid_after_expiry,
      createdAt: row.created_at,
    };
  });

  const hasMore = count !== null ? from + rows.length < count : rows.length === pageSize;

  return {
    items,
    nextPage: hasMore ? page + 1 : null,
    totalCount: count ?? null,
  };
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
    timeLabel: formatMovementDateLabel(row.paid_at ?? row.created_at),
    status: row.status,
    paidAfterExpiry: row.paid_after_expiry,
    createdAt: row.created_at,
  }));
}
