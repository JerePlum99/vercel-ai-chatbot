import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime to avoid edge limitations
export const runtime = 'nodejs';

/**
 * Debug endpoint that shows all cookies for troubleshooting authentication issues
 * Only provides detailed information in development environments
 */
export async function GET(request: NextRequest) {
  const isDevelopment = process.env.VERCEL_ENV !== 'production';
  
  try {
    // Get all cookies
    const cookies = request.cookies.getAll();
    
    // Filter auth-related cookies
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session')
    );
    
    // Get different auth cookie variations
    const betterAuthDash = cookies.find(c => c.name === 'better-auth.session_token');
    const betterAuthUnderscore = cookies.find(c => c.name === 'better_auth.session_token');
    const betterAuth = cookies.find(c => c.name === 'better-auth_session');
    const sessionToken = cookies.find(c => c.name === 'session_token');
    
    // Prepare detailed response
    if (isDevelopment) {
      return NextResponse.json({
        // Auth cookie variations
        authCookies: {
          'better-auth.session_token': betterAuthDash ? `${betterAuthDash.value.substring(0, 10)}...` : null,
          'better_auth.session_token': betterAuthUnderscore ? `${betterAuthUnderscore.value.substring(0, 10)}...` : null,
          'better-auth_session': betterAuth ? `${betterAuth.value.substring(0, 10)}...` : null,
          'session_token': sessionToken ? `${sessionToken.value.substring(0, 10)}...` : null,
        },
        
        // All cookies with partial values
        allCookies: cookies.map(c => ({
          name: c.name,
          value: c.value ? `${c.value.substring(0, 10)}...` : null
        })),
        
        // Environment information
        environment: process.env.VERCEL_ENV || 'local',
        baseUrl: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      });
    } else {
      // Limited information in production
      return NextResponse.json({
        // Just counts for security
        totalCookies: cookies.length,
        authCookieCount: authCookies.length,
        hasAuthCookie: authCookies.length > 0
      });
    }
  } catch (error) {
    console.error("Cookie debug error:", error);
    return NextResponse.json({ error: "Failed to debug cookies" }, { status: 500 });
  }
} 