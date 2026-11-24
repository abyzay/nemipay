import type { CurrencyCode } from '@/types/common';

export interface MerchantInfo {
  id: string;
  ownerName: string;
  businessName: string;
  greetingSubtitle: string;
  avatarInitials: string;
  codiAlias: string;
  clabeMasked: string;
  bankName: string;
}

export interface DashboardSummary {
  currency: CurrencyCode;
  todayReceivedCents: number;
  todayCount: number;
  availableSettledCents: number;
  unreadNotifications: number;
}

export interface DashboardNotification {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
}

export interface DashboardData {
  merchant: MerchantInfo;
  summary: DashboardSummary;
  notifications: DashboardNotification[];
}
