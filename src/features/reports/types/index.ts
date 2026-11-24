export type ReportPeriodId = 'today' | 'week' | 'month';

export interface ReportPeriodSummary {
  id: ReportPeriodId;
  label: string;
  totalReceivedCents: number;
  paymentsCount: number;
  averageTicketCents: number;
  qrSharePercent: number;
}
