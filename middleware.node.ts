import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth/auth";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login', 
  '/register', 
  '/api/auth',
  '/api/auth/callback',
  '/_next',
  '/favicon.ico'
];

/**
 * Better Auth middleware for robust authentication checks
 * Uses the recommended approach with Node.js runtime from Better Auth docs
 * 
 * @param request The Next.js request
 * @returns Response or continues to the next middleware
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const host = request.headers.get('host') || 'unknown';
  
  console.log(`[Middleware] Environment Info:`, {
    path,
    host,
    runtime: process.env.NEXT_RUNTIME || 'unknown',
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    nodeEnv: process.env.NODE_ENV || 'unknown'
  });
  
  // Quick exit for public routes
  if (PUBLIC_ROUTES.some(route => path === route || path.startsWith(`${route}/`))) {
    return NextResponse.next();
  }
  
  try {
    // Use BetterAuth's session validation
    const session = await auth.api.getSession(request);
    
    if (!session) {
      console.log(`[Middleware] No valid session found, redirecting to login`);
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    console.log(`[Middleware] Valid session found for user ${session.user.id}, proceeding to ${path}`);
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Error:', error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Configure middleware matcher
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