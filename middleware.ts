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

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip middleware for public routes
  if (matchesPattern(path, ROUTE_PATTERNS.public)) {
    return setSecurityHeaders(NextResponse.next());
  }

  // Check for session cookie using Better Auth's utility
  const sessionCookie = getSessionCookie(request, {
    cookieName: "session_token",
    cookiePrefix: "better-auth",
    useSecureCookies: process.env.NODE_ENV !== 'development'
  });

  if (!sessionCookie) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    return setSecurityHeaders(response);
  }

  return setSecurityHeaders(NextResponse.next());
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
