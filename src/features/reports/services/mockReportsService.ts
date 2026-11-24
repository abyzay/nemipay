import mockReports from '../data/mockReports.json';
import type { ReportPeriodSummary } from '../types';

export function getMockReportPeriods(): ReportPeriodSummary[] {
  return mockReports.periods as ReportPeriodSummary[];
}
