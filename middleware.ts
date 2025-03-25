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
  ] as const,
  protected: [
    '/chat',
    '/dashboard',
    '/settings'
  ] as const
} as const;

const isDevelopment = process.env.VERCEL_ENV !== 'production';

// Simple helper to check if path matches any pattern
function matchesPattern(path: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => 
    path === pattern || 
    path.startsWith(`${pattern}/`)
  );
}

// Create redirect response with security headers
function createAuthResponse(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Quick exit for public routes
  if (matchesPattern(path, ROUTE_PATTERNS.public)) {
    return NextResponse.next();
  }
  
  // For protected routes, first check if token exists
  if (matchesPattern(path, ROUTE_PATTERNS.protected)) {
    const sessionToken = request.cookies.get('better-auth.session_token');
    
    // If no token exists, redirect to login
    if (!sessionToken) {
      isDevelopment && console.log(`Auth failed: No session token for ${path}`);
      return createAuthResponse(request);
    }
    
    // If token exists, validate it
    const sessionCookie = getSessionCookie(request, {
      cookiePrefix: "better-auth",
      useSecureCookies: process.env.VERCEL_ENV === "production"
    });

    // If session is invalid, redirect to login
    if (!sessionCookie) {
      isDevelopment && console.log(`Auth failed: Invalid session for ${path}`);
      return createAuthResponse(request);
    }
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
