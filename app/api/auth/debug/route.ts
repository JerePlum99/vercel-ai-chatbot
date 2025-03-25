import { auth } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";

// Allow full debug info in development and preview environments, but not production
const isDevelopment = process.env.VERCEL_ENV !== 'production';

/**
 * Debug endpoint to check cookies and session status
 * In production, this endpoint provides limited information for security reasons
 */
export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const cookies = request.cookies.getAll();
    
    // Try to get the session
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });
    
    // Prepare response based on environment
    if (isDevelopment) {
      // Full debug info in development
      return NextResponse.json({
        cookies: cookies.map(c => ({ 
          name: c.name, 
          value: c.value ? `${c.value.substring(0, 10)}...` : null 
        })),
        hasSession: !!session,
        sessionUser: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        } : null,
        headerCookies: request.headers.get('cookie')
      });
    } else {
      // Limited info in production for security
      return NextResponse.json({
        cookieCount: cookies.length,
        authCookieExists: cookies.some(c => c.name.toLowerCase().includes('auth')),
        hasSession: !!session,
        isAuthenticated: !!session?.user
      });
    }
  } catch (error) {
    console.error("Error in debug route:", error);
    return NextResponse.json(
      { error: "Failed to debug session" },
      { status: 500 }
    );
  }
} 