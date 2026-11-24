export type ReportPeriodId = 'today' | 'week' | 'month';

export interface ReportChartPoint {
  label: string;
  value: number;
  paymentsCount: number;
}

export interface ReportPeriodSummary {
  id: ReportPeriodId;
  label: string;
  totalReceivedCents: number;
  paymentsCount: number;
  averageTicketCents: number;
  highestPaymentCents: number;
  qrSharePercent: number;
  yAxisStepValue: number;
  yAxisMaxValue: number;
  chartPoints: ReportChartPoint[];
}
