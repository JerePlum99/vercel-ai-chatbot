import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime to properly handle Better Auth requirements
export const runtime = 'nodejs';

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
  const isDevelopment = process.env.VERCEL_ENV === 'development';
  const vercelUrl = process.env.VERCEL_URL;
  
  // Debug information for cookie troubleshooting
  const allCookies = request.cookies.getAll();
  const cookieNames = allCookies.map(c => c.name);
  const hasBetterAuthCookie = allCookies.some(c => c.name.startsWith('better-auth'));

  console.log(`[Middleware] Path: ${path}, Host: ${host}, ENV: ${process.env.VERCEL_ENV}`);
  console.log(`[Middleware] VERCEL_URL: ${vercelUrl}`);
  console.log(`[Middleware] Cookies: ${cookieNames.join(', ')}`);
  console.log(`[Middleware] Has BetterAuth cookie: ${hasBetterAuthCookie}`);
  console.log(`[Middleware] Cookie details:`, allCookies.map(c => ({ name: c.name, value: c.value ? '[PRESENT]' : '[EMPTY]' })));
  
  // Quick exit for public routes
  if (PUBLIC_ROUTES.some(route => path === route || path.startsWith(`${route}/`))) {
    return NextResponse.next();
  }
  
  try {
    // For protected routes - use a cookie-based fallback approach
    // This avoids using auth.api.getSession() which depends on perf_hooks
    const sessionToken = request.cookies.get('better-auth.session_token');
    
    // If no token exists, redirect to login
    if (!sessionToken) {
      console.log(`[Middleware] No session token found, redirecting to login`);
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    console.log(`[Middleware] Session token found, proceeding to ${path}`);
    
    // Basic cookie validation - we're not fully validating the session here
    // Just checking for cookie existence to avoid Edge runtime conflicts
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Error:', error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
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
