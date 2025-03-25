import { auth } from './auth';
import { AuthSession, MaybeAuthSession } from './auth-types';
import { getSessionUser } from './session';

/**
 * Unified session verification for API routes
 * Provides a consistent way to validate user sessions across all API endpoints
 */
export async function verifySession(request: Request): Promise<{
  authorized: boolean;
  session: MaybeAuthSession;
  status?: number;
  message?: string;
}> {
  try {
    // Use BetterAuth's built-in session validation
    const session = await auth.api.getSession({
      headers: request.headers
    });

    // Check for complete session validity
    if (!session || !session.user?.id) {
      return {
        authorized: false,
        session: null,
        status: 401,
        message: 'Unauthorized: User not authenticated'
      };
    }

    return {
      authorized: true,
      session: session as AuthSession,
      status: 200
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return {
      authorized: false,
      session: null,
      status: 500,
      message: 'Authentication error'
    };
  }
}

/**
 * Session verification for Next.js App Router middleware and server components
 * Uses the getSessionUser helper
 */
export async function verifyServerSession(): Promise<{
  authorized: boolean;
  session: MaybeAuthSession;
  status?: number;
  message?: string;
}> {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return {
        authorized: false,
        session: null,
        status: 401,
        message: 'Unauthorized: User not authenticated'
      };
    }

    // Create a session-like object
    // We know the user matches our AuthUser type as that's what getSessionUser returns
    const session: AuthSession = { 
      user: { 
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image || undefined
      } 
    };

    return {
      authorized: true,
      session,
      status: 200
    };
  } catch (error) {
    console.error('Server session verification error:', error);
    return {
      authorized: false,
      session: null,
      status: 500,
      message: 'Authentication error'
    };
  }
} 