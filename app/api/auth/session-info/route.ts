import { auth } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint to check session status and user info
 */
export async function GET(request: NextRequest) {
  try {
    // Get all cookies for inspection
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
    const authCookies = cookies.filter(cookie => 
      cookie.startsWith('better-auth.') || 
      cookie.startsWith('next-auth.') ||
      cookie.startsWith('better_auth_')
    );
    
    // Get the session using BetterAuth
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });
    
    // Return comprehensive session info
    return NextResponse.json({
      authenticated: !!session,
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
      name: session?.user?.name || null,
      sessionType: "BetterAuth",
      hasSession: !!session,
      cookies: {
        all: cookies,
        auth: authCookies
      },
      requestHeaders: {
        userAgent: request.headers.get("user-agent"),
        host: request.headers.get("host"),
        referer: request.headers.get("referer")
      },
      sessionExpires: session ? new Date(session.session.expiresAt).toISOString() : null
    });
  } catch (error) {
    console.error("Error getting session info:", error);
    return NextResponse.json(
      { 
        error: "Failed to get session info",
        errorMessage: error instanceof Error ? error.message : String(error),
        authenticated: false,
        sessionType: "Error",
        cookies: request.headers.get("cookie")?.split(';').map(c => c.trim()) || []
      },
      { status: 500 }
    );
  }
} 