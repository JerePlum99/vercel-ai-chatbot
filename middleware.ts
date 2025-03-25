import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const ROUTE_PATTERNS = {
  public: [
    '/login', 
    '/register', 
    '/api/auth',
    '/api/auth/callback',
    '/_next',
    '/favicon.ico',
  ] as const
} as const;

// Simple helper to check if path matches any pattern
function matchesPattern(path: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => 
    path === pattern || 
    path.startsWith(`${pattern}/`)
  );
}

export const config = {
  matcher: [
    // Protected routes
    '/chat/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    // Public routes that still need security headers
    '/login',
    '/register',
    // Root path
    '/'
  ]
};

export async function middleware(request: NextRequest) {
  // Log middleware environment for debugging
  console.info('Middleware Environment:', {
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
    url: request.url,
    path: request.nextUrl.pathname
  });

  const path = request.nextUrl.pathname;
  
  // Skip middleware for public routes
  if (matchesPattern(path, ROUTE_PATTERNS.public)) {
    return NextResponse.next();
  }

  // Check for session cookie using Better Auth's utility
  const sessionCookie = getSessionCookie(request, {
    cookieName: "session_token",
    cookiePrefix: "better-auth",
    // Use secure cookies in production and preview environments
    useSecureCookies: process.env.VERCEL_ENV !== 'development'
  });

  if (!sessionCookie) {
    // Get the base URL for redirection
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : request.nextUrl.origin);

    // Redirect to login with return URL
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
    
    // Log redirection for debugging
    console.info('Middleware Redirect:', {
      from: request.url,
      to: loginUrl.toString(),
      baseUrl,
      hasCookie: !!sessionCookie
    });

    return NextResponse.redirect(loginUrl);
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}
