export type SessionStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface MerchantProfile {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  clabe: string | null;
  bankName: string | null;
  notificationsEnabled: boolean;
  voiceAnnouncementsEnabled: boolean;
  createdAt: string;
}

export interface MerchantProfilePatch {
  name?: string;
  ownerName?: string | null;
  phone?: string | null;
  clabe?: string | null;
  bankName?: string | null;
  notificationsEnabled?: boolean;
  voiceAnnouncementsEnabled?: boolean;
}

export type { LoginFormValues, RegisterFormValues } from '../schemas';
