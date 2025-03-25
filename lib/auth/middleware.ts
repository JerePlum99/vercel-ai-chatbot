import { NextRequest, NextResponse } from "next/server";
import { auth } from './auth';

/**
 * Verify authentication in middleware context
 * 
 * @param request The Next.js request object
 * @returns Object with authentication result, session, and response if auth failed
 */
export async function verifyMiddlewareAuth(request: NextRequest): Promise<{ 
  authenticated: boolean;
  authResponse?: NextResponse;
}> {
  const isDevelopment = process.env.VERCEL_ENV !== 'production';
  
  try {
    // Try using Better Auth's session validation first
    try {
      const session = await auth.api.getSession({ 
        headers: request.headers 
      });
      
      // If session is valid, return success
      if (session && session.user) {
        return {
          authenticated: true
        };
      }
    } catch (sessionError) {
      // Log error but continue to fallback
      isDevelopment && console.log('Session API error, trying cookie fallback:', sessionError);
    }
    
    // Fallback: Check for session token cookie existence
    const sessionToken = request.cookies.get('better-auth.session_token');
    
    // If session token exists, we'll assume it's valid for middleware purposes
    // The actual API endpoints will perform full validation
    if (sessionToken) {
      isDevelopment && console.log('Using cookie fallback authentication');
      return {
        authenticated: true
      };
    }
    
    // No valid session found
    isDevelopment && console.log(`Auth failed: No valid session or token`);
    
    // Create redirect response with security headers
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    return {
      authenticated: false,
      authResponse: response
    };
  } catch (error) {
    isDevelopment && console.log('Middleware auth error:', error);
    
    // Create redirect response with security headers
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    return {
      authenticated: false,
      authResponse: response
    };
  }
} 