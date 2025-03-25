import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

// Force Node.js runtime to handle auth properly
export const runtime = 'nodejs';

/**
 * API route to debug authentication issues
 * This endpoint provides details about cookies, environment, and authentication settings
 */
export async function GET(request: NextRequest) {
  try {
    // Get request information
    const host = request.headers.get('host') || 'unknown';
    const cookies = request.cookies.getAll();
    const authCookies = cookies.filter(c => c.name.includes('auth'));
    
    // Check session (safely)
    let sessionInfo = "No session check attempted";
    let session = null;
    try {
      session = await auth.api.getSession({ headers: request.headers });
      sessionInfo = session ? "Valid session found" : "No valid session";
    } catch (e) {
      sessionInfo = `Session check error: ${e instanceof Error ? e.message : String(e)}`;
    }
    
    // Get environment variables (safe for preview)
    const environment = {
      NODE_ENV: process.env.NODE_ENV || 'unknown',
      VERCEL_ENV: process.env.VERCEL_ENV || 'unknown',
      VERCEL_URL: process.env.VERCEL_URL || 'unknown',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'undefined'
    };
    
    // Note: Can't directly access auth config in BetterAuth
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      request: { 
        host,
        url: request.url,
        method: request.method,
      },
      cookies: {
        count: cookies.length,
        names: cookies.map(c => c.name),
        authCookies: authCookies.map(c => ({
          name: c.name,
          // Show just enough to debug but not expose full value
          valuePreview: c.value ? `${c.value.substring(0, 5)}...` : 'empty'
        })),
      },
      session: {
        status: sessionInfo,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
        } : null
      },
      environment
    });
  } catch (error) {
    console.error("Auth debug error:", error);
    return NextResponse.json({
      error: "Failed to debug auth",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 