import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface AuthenticatedUser {
  userId: string;
  email: string | null;
}

export type AuthResolver = (req: Request) => Promise<AuthenticatedUser | null>;

export function createSupabaseAuthResolver(adminClient: SupabaseClient): AuthResolver {
  return async (req: Request): Promise<AuthenticatedUser | null> => {
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return null;
    }

    const { data, error } = await adminClient.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }

    return {
      userId: data.user.id,
      email: data.user.email ?? null,
    };
  };
}
