import { auth } from './auth';
import { headers as nextHeaders } from 'next/headers';

/**
 * Get the current session user from BetterAuth
 */
export async function getSessionUser() {
  const headers = await nextHeaders();
  const session = await auth.api.getSession({ headers });
  return session?.user;
} 