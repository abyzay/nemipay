export type ReportRange = '7d' | '30d' | '90d';

export interface SalesChartPoint {
  key: string;
  label: string;
  amountCents: number;
  count: number;
}

export interface PaymentMethodBreakdownItem {
  id: 'codi';
  label: string;
  amountCents: number;
  count: number;
  percentage: number;
  color: string;
}

export interface SalesReportData {
  range: ReportRange;
  totalCents: number;
  previousTotalCents: number;
  totalCount: number;
  growthPercent: number | null;
  series: SalesChartPoint[];
  paymentMethods: PaymentMethodBreakdownItem[];
}
