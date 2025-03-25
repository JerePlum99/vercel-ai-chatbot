import { NextRequest, NextResponse } from "next/server";
import { verifyMiddlewareAuth } from "@/lib/auth/middleware";

// Force Node.js runtime for middleware to support Better Auth
export const runtime = 'nodejs';

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

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Quick exit for public routes
  if (matchesPattern(path, ROUTE_PATTERNS.public)) {
    return NextResponse.next();
  }
  
  // For protected routes, verify authentication using our centralized helper
  if (matchesPattern(path, ROUTE_PATTERNS.protected)) {
    const { authenticated, authResponse } = await verifyMiddlewareAuth(request);
    
    // If authentication failed, return the redirect response
    if (!authenticated) {
      isDevelopment && console.log(`Auth failed for ${path}`);
      return authResponse;
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
