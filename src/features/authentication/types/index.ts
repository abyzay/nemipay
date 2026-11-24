export type SessionStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  displayName: string;
  role: string;
  businessId: string;
}

export type { LoginFormValues, RegisterFormValues } from '../schemas';
