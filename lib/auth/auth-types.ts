import type { User } from '@/lib/db/schema';

/**
 * Better Auth session structure from the database
 */
export interface SessionData {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Better Auth user structure with our custom fields
 */
export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  is_admin: boolean;
}

/**
 * Better Auth session response structure
 */
export interface AuthSession {
  session: SessionData;
  user: SessionUser & Partial<User>;
}

/**
 * Type for when a session might not exist
 */
export type MaybeAuthSession = AuthSession | null | undefined;

/**
 * Helper to check if a session is valid and authenticated
 */
export function isAuthenticatedSession(session: MaybeAuthSession): session is AuthSession {
  return !!session?.user?.id;
}

/**
 * Helper to check if a session is valid, authenticated, and not expired
 */
export function isValidSession(session: MaybeAuthSession): session is AuthSession {
  if (!isAuthenticatedSession(session)) return false;
  return new Date(session.session.expiresAt) > new Date();
} 