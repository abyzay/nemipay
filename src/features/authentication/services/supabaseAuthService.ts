import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import type { Database } from '@/types/database';
import type { AuthUser, MerchantProfile, MerchantProfilePatch } from '../types';

const MERCHANT_PROFILE_SELECT =
  'id, name, owner_name, phone, clabe, bank_name, notifications_enabled, voice_announcements_enabled, created_at';

type MerchantDbRow = Omit<Database['public']['Tables']['merchants']['Row'], 'updated_at'>;
type MerchantDbUpdate = Database['public']['Tables']['merchants']['Update'];

function mapMerchantRow(row: MerchantDbRow): MerchantProfile {
  return {
    id: row.id,
    name: row.name,
    ownerName: row.owner_name ?? null,
    phone: row.phone ?? null,
    clabe: row.clabe ?? null,
    bankName: row.bank_name ?? null,
    notificationsEnabled: row.notifications_enabled ?? true,
    voiceAnnouncementsEnabled: row.voice_announcements_enabled ?? true,
    createdAt: row.created_at,
  };
}

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
    .select(MERCHANT_PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapMerchantRow(data);
}

export async function updateMerchantProfile(
  userId: string,
  patch: MerchantProfilePatch
): Promise<MerchantProfile> {
  const updatePayload: MerchantDbUpdate = {};

  if (patch.name !== undefined) {
    updatePayload.name = patch.name.trim();
  }
  if (patch.ownerName !== undefined) {
    const trimmed = patch.ownerName?.trim() ?? '';
    updatePayload.owner_name = trimmed.length > 0 ? trimmed : null;
  }
  if (patch.phone !== undefined) {
    const trimmed = patch.phone?.trim() ?? '';
    updatePayload.phone = trimmed.length > 0 ? trimmed : null;
  }
  if (patch.clabe !== undefined) {
    const digits = patch.clabe?.replace(/\D/g, '') ?? '';
    updatePayload.clabe = digits.length > 0 ? digits : null;
  }
  if (patch.bankName !== undefined) {
    const trimmed = patch.bankName?.trim() ?? '';
    updatePayload.bank_name = trimmed.length > 0 ? trimmed : null;
  }
  if (patch.notificationsEnabled !== undefined) {
    updatePayload.notifications_enabled = patch.notificationsEnabled;
  }
  if (patch.voiceAnnouncementsEnabled !== undefined) {
    updatePayload.voice_announcements_enabled = patch.voiceAnnouncementsEnabled;
  }

  const { data, error } = await supabase
    .from('merchants')
    .update(updatePayload)
    .eq('id', userId)
    .select(MERCHANT_PROFILE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudieron guardar los cambios del perfil.');
  }

  return mapMerchantRow(data);
}

export async function updateMerchantName(userId: string, name: string): Promise<MerchantProfile> {
  return updateMerchantProfile(userId, { name });
}
