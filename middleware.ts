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

// Debug helper to safely stringify objects/headers
function debugStringify(obj: any): string {
  try {
    if (obj instanceof Headers) {
      return JSON.stringify(Object.fromEntries([...obj.entries()]));
    }
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return `[Error stringifying: ${e}]`;
  }
}

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
  console.log(`[Auth Debug] Middleware executing for path: ${path}`);
  console.log(`[Auth Debug] Request headers:`, debugStringify(request.headers));
  console.log(`[Auth Debug] All cookies:`, debugStringify(request.cookies.getAll()));
  console.log(`[Auth Debug] Environment:`, {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL
  });

  // Skip middleware for public routes
  if (matchesPattern(path, ROUTE_PATTERNS.public)) {
    console.log(`[Auth Debug] Skipping auth check for public route: ${path}`);
    return setSecurityHeaders(NextResponse.next());
  }

  // Check for session cookie using Better Auth's utility
  const sessionCookie = getSessionCookie(request);
  console.log(`[Auth Debug] Session cookie found:`, !!sessionCookie);
  if (sessionCookie) {
    console.log(`[Auth Debug] Session cookie value:`, '[REDACTED]');
  }

  if (!sessionCookie) {
    console.log(`[Auth Debug] No session cookie found, redirecting to login`);
    const response = NextResponse.redirect(new URL("/login", request.url));
    return setSecurityHeaders(response);
  }

  console.log(`[Auth Debug] Auth check passed, proceeding to ${path}`);
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
