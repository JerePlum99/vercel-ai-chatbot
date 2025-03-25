import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Quick exit for public routes
  if (matchesPattern(path, ROUTE_PATTERNS.public)) {
    return NextResponse.next();
  }

  // Check session cookie - faster than full session check
  const sessionCookie = getSessionCookie(request, {
    cookieName: "session_token",
    cookiePrefix: "better-auth",
    useSecureCookies: process.env.NODE_ENV === "production"
  });

  if (!sessionCookie) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }

  // Add security headers and continue
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
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
