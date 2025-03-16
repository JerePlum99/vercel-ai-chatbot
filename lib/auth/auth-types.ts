/**
 * Shared authentication types used across the application
 * Creates a unified interface for both BetterAuth and any other auth systems
 */

/**
 * Standard user object with required ID and optional fields
 */
export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  [key: string]: any;
}

/**
 * Standard session object with required user and optional fields
 */
export interface AuthSession {
  user: AuthUser;
  expires?: Date | string;
  [key: string]: any;
}

/**
 * Optional session (can be null during auth checks)
 */
export type MaybeAuthSession = AuthSession | null; 