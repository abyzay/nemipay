import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import type { AuthUser, MerchantProfile } from '../types';

export function mapSupabaseUser(user: User, merchantName?: string): AuthUser {
  const email = user.email ?? '';
  const metadataName =
    typeof user.user_metadata?.merchant_name === 'string'
      ? user.user_metadata.merchant_name
      : undefined;
  const displayName = merchantName?.trim() || metadataName?.trim() || email || 'Comercio NemiPay';

  return {
    id: user.id,
    email,
    displayName,
  };
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ user: AuthUser; session: Session }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user || !data.session) {
    throw new Error('Correo o contraseña incorrectos.');
  }

  return {
    user: mapSupabaseUser(data.user),
    session: data.session,
  };
}

export async function signOutSession(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function fetchMerchantProfile(userId: string): Promise<MerchantProfile | null> {
  const { data, error } = await supabase
    .from('merchants')
    .select('id, name, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
  };
}

export async function updateMerchantName(userId: string, name: string): Promise<MerchantProfile> {
  const trimmed = name.trim();
  const { data, error } = await supabase
    .from('merchants')
    .update({ name: trimmed })
    .eq('id', userId)
    .select('id, name, created_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo actualizar el nombre del comercio.');
  }

  return {
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
  };
}
