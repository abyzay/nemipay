import { supabase } from '@/services/supabase';
import type {
  PaymentMethodBreakdownItem,
  ReportRange,
  SalesChartPoint,
  SalesReportData,
} from '../types';

const MEXICO_CITY_TZ = 'America/Mexico_City';
const DAY_MS = 86_400_000;
const PAGE_SIZE = 1000;
const MAX_PAGES = 10;

const WEEKDAYS_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const MONTHS_SHORT_ES = [
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

export interface RawConfirmedCharge {
  amount_cents: number;
  created_at: string;
  paid_at: string | null;
}

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

function toMexicoCityDayUtc(date: Date): number {
  const { year, month, day } = getMexicoCityDateParts(date);
  return Date.UTC(year, month - 1, day);
}

function getRangeDays(range: ReportRange): number {
  switch (range) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
  }
}

function createBuckets(
  range: ReportRange,
  currentStartUtc: number
): {
  bucketCount: number;
  bucketSizeDays: number;
  labels: string[];
} {
  if (range === '7d') {
    const labels = Array.from({ length: 7 }, (_, index) => {
      const dayUtc = currentStartUtc + index * DAY_MS;
      const weekday = new Date(dayUtc).getUTCDay();
      return WEEKDAYS_SHORT_ES[weekday] ?? '';
    });
    return { bucketCount: 7, bucketSizeDays: 1, labels };
  }

  if (range === '30d') {
    const labels = Array.from({ length: 5 }, (_, index) => `Sem ${index + 1}`);
    return { bucketCount: 5, bucketSizeDays: 6, labels };
  }

  const labels = Array.from({ length: 3 }, (_, index) => {
    const midpointUtc = currentStartUtc + (index * 30 + 15) * DAY_MS;
    const monthIdx = new Date(midpointUtc).getUTCMonth();
    return MONTHS_SHORT_ES[monthIdx] ?? '';
  });
  return { bucketCount: 3, bucketSizeDays: 30, labels };
}

export function buildSalesReport(
  rows: RawConfirmedCharge[],
  range: ReportRange,
  now: Date = new Date()
): SalesReportData {
  const days = getRangeDays(range);
  const todayUtc = toMexicoCityDayUtc(now);
  const currentStartUtc = todayUtc - (days - 1) * DAY_MS;
  const previousStartUtc = todayUtc - (2 * days - 1) * DAY_MS;
  const previousEndUtc = currentStartUtc - DAY_MS;

  const { bucketCount, bucketSizeDays, labels } = createBuckets(range, currentStartUtc);
  const series: SalesChartPoint[] = labels.map((label, index) => ({
    key: `${range}-${index}`,
    label,
    amountCents: 0,
    count: 0,
  }));

  let totalCents = 0;
  let totalCount = 0;
  let previousTotalCents = 0;

  for (const row of rows) {
    const timestamp = row.paid_at ?? row.created_at;
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      continue;
    }

    const dayUtc = toMexicoCityDayUtc(parsed);
    const amountCents = Number(row.amount_cents) || 0;

    if (dayUtc >= currentStartUtc && dayUtc <= todayUtc) {
      totalCents += amountCents;
      totalCount += 1;

      const dayOffset = Math.floor((dayUtc - currentStartUtc) / DAY_MS);
      const bucketIdx = Math.min(
        bucketCount - 1,
        Math.max(0, Math.floor(dayOffset / bucketSizeDays))
      );
      const bucket = series[bucketIdx];
      if (bucket) {
        bucket.amountCents += amountCents;
        bucket.count += 1;
      }
    } else if (dayUtc >= previousStartUtc && dayUtc <= previousEndUtc) {
      previousTotalCents += amountCents;
    }
  }

  let growthPercent: number | null;
  if (previousTotalCents > 0) {
    growthPercent = Math.round(((totalCents - previousTotalCents) / previousTotalCents) * 100);
  } else if (totalCents === 0) {
    growthPercent = 0;
  } else {
    growthPercent = null;
  }

  const paymentMethods: PaymentMethodBreakdownItem[] = [
    {
      id: 'codi',
      label: 'CoDi',
      amountCents: totalCents,
      count: totalCount,
      percentage: totalCents > 0 ? 100 : 0,
      color: '#7200D9',
    },
  ];

  return {
    range,
    totalCents,
    previousTotalCents,
    totalCount,
    growthPercent,
    series,
    paymentMethods,
  };
}

export async function fetchSalesReport(
  range: ReportRange,
  now: Date = new Date()
): Promise<SalesReportData> {
  const days = getRangeDays(range);
  const sinceIso = new Date(now.getTime() - (2 * days + 2) * DAY_MS).toISOString();
  const allRows: RawConfirmedCharge[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('charges')
      .select('amount_cents, created_at, paid_at')
      .eq('status', 'CONFIRMED')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as RawConfirmedCharge[];
    allRows.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }
  }

  return buildSalesReport(allRows, range, now);
}
