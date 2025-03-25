import { auth } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime to avoid edge limitations
export const runtime = 'nodejs';

// Allow full debug info in development and preview environments, but not production
const isDevelopment = process.env.VERCEL_ENV !== 'production';

/**
 * Enhanced debug endpoint to specifically check session validation
 * Provides detailed information about session validation process
 */
export async function GET(request: NextRequest) {
  try {
    // Get all cookies for troubleshooting
    const cookies = request.cookies.getAll();
    const cookieHeader = request.headers.get("cookie") || "";
    
    // Try to get the session
    const sessionResult = await auth.api.getSession({ 
      headers: request.headers 
    });
    
    // Get the raw session token for debugging
    const sessionToken = request.cookies.get('better-auth.session_token');
    
    // Prepare detailed response with both success and failure information
    if (isDevelopment) {
      return NextResponse.json({
        // Basic session info
        hasSession: !!sessionResult,
        authenticated: !!sessionResult?.user?.id,
        
        // Session token details - redacted for security
        sessionTokenExists: !!sessionToken,
        sessionTokenValue: sessionToken ? `${sessionToken.value.substring(0, 6)}...` : null,
        
        // Session payload - only show limited user fields for security
        sessionUser: sessionResult?.user ? {
          id: sessionResult.user.id,
          email: sessionResult.user.email,
          name: sessionResult.user.name,
        } : null,
        
        // Session metadata
        sessionExpires: sessionResult?.session?.expiresAt ? 
          new Date(sessionResult.session.expiresAt).toISOString() : null,
        
        // Cookie debugging info - show only name and partial value
        cookies: cookies.map(c => ({ 
          name: c.name,
          // Only show first few chars of value
          value: c.value ? `${c.value.substring(0, 6)}...` : null
        })),
        
        // Raw cookie header (redacted)
        rawCookieHeader: cookieHeader ? `${cookieHeader.substring(0, 20)}...` : null,
        
        // Environment info
        environment: process.env.VERCEL_ENV || 'local',
        baseUrl: process.env.BETTER_AUTH_URL || 
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
      });
    } else {
      // Limited info in production for security
      return NextResponse.json({
        authenticated: !!sessionResult?.user,
        hasSessionToken: !!sessionToken,
        environmentInfo: {
          env: process.env.VERCEL_ENV || 'local',
          // Don't expose full URL in production
          hasBaseUrl: !!process.env.BETTER_AUTH_URL || !!process.env.VERCEL_URL,
        }
      });
    }
  } catch (error) {
    console.error("Error in session debug route:", error);
    
    // Return error info in development, limited info in production
    if (isDevelopment) {
      return NextResponse.json(
        { 
          error: "Failed to debug session",
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          cookies: request.cookies.getAll().map(c => c.name)
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to debug session" },
        { status: 500 }
      );
    }
  }
} 