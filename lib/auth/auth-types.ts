import type { User } from '@/lib/db/schema';

/**
 * Better Auth session type with our custom user fields
 */
export interface AuthSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    is_admin: boolean;
  } & Partial<User>;
  expires: string;
}

/**
 * Type for when a session might not exist
 */
export type MaybeAuthSession = AuthSession | null | undefined;

/**
 * Helper to check if a session is valid and authenticated
 * This is a type guard that ensures both session and session.user exist
 */
export function isAuthenticatedSession(session: MaybeAuthSession): session is AuthSession & { user: NonNullable<AuthSession['user']> } {
  return !!session?.user?.id;
} 