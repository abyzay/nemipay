export type SessionStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface MerchantProfile {
  id: string;
  name: string;
  createdAt: string;
}

export type { LoginFormValues, RegisterFormValues } from '../schemas';
