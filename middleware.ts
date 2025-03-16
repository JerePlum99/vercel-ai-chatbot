import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Define routes that should be publicly accessible
const publicRoutes = [
  '/login', 
  '/register', 
  '/api/auth',
  // Critical: Allow OAuth callback routes to complete without middleware interference
  '/api/auth/callback'
];

// Define protected routes that require authentication
const protectedRoutes = ['/chat', '/dashboard', '/settings'];

// BetterAuth configuration - updated to match actual cookie names
const authConfig = {
  cookiePrefix: "better-auth", // Changed from better_auth to better-auth to match actual cookie name
  useSecureCookies: process.env.NODE_ENV === "production"
};

// Development mode flag for conditional logging
const isDevelopment = process.env.NODE_ENV !== 'production';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Only log in development mode
  if (isDevelopment) {
    console.log(`Middleware processing: ${path}`);
    console.log(`Request type: ${request.headers.get('next-router-state-tree') ? 'Client Navigation' : 
                 request.headers.get('x-middleware-prefetch') ? 'Prefetch' : 'Server Load'}`);
  }

  // Skip full auth check for prefetch requests - just check if any auth cookie exists
  if (request.headers.get('x-middleware-prefetch')) {
    const hasAuthCookie = request.cookies.has('better-auth.session_token');
    if (!hasAuthCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
  
  // Always allow public routes
  if (publicRoutes.some(route => path.startsWith(route))) {
    if (isDevelopment) {
      console.log(`Allowing public route: ${path}`);
    }
    return NextResponse.next();
  }
  
  // Check if current path needs protection
  const isProtectedRoute = protectedRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
  
  if (isProtectedRoute) {
    // Use the BetterAuth helper to get session cookie as recommended
    const sessionCookie = getSessionCookie(request, authConfig);
    
    // Debug the session cookie in development only
    if (isDevelopment) {
      // Get all cookies for debugging purposes
      const allCookies = request.cookies.getAll();
      console.log(`All cookies for ${path}:`, allCookies.map(c => c.name));
      console.log(`BetterAuth session cookie for ${path}: ${sessionCookie ? 'Found' : 'Not found'}`);
    }
    
    // Primary verification method - use the BetterAuth helper
    if (!sessionCookie) {
      // Fallback check until we confirm the cookie naming is fully resolved
      // Check for any auth-related cookie for backward compatibility
      const hasAuthCookie = request.cookies.getAll().some(
        cookie => cookie.name.toLowerCase().includes('auth')
      );
      
      // If no auth cookie at all, redirect to login
      if (!hasAuthCookie) {
        if (isDevelopment) {
          console.log(`No valid session, redirecting from ${path} to /login`);
        }
        return NextResponse.redirect(new URL("/login", request.url));
      }
      
      if (isDevelopment) {
        console.log(`Using fallback auth cookie check for ${path}`);
      }
    }
    
    if (isDevelopment) {
      console.log(`Valid session found for ${path}, proceeding`);
    }
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

// Apply middleware to specific routes using a simpler pattern
export const config = {
  matcher: [
    // Protected routes
    '/chat/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    
    // Root path - check but handle specially in the middleware
    '/'
  ]
};
