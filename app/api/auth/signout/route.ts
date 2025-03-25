import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

// Development mode flag for conditional logging
const isDevelopment = process.env.VERCEL_ENV !== 'production';

/**
 * Custom signout endpoint that ensures all cookies are properly cleared
 */
export async function POST(request: NextRequest) {
  try {
    // Get all cookies from the request to debug
    const allCookies = request.cookies.getAll();
    
    if (isDevelopment) {
      console.log("Cookies before signout:", allCookies.map(c => c.name));
    }
    
    // List of possible auth-related cookie names to clear
    const cookieNames = [
      // Better-auth cookies with dash
      "better-auth_session",
      "better-auth.session_token",
      "better-auth.session-token",
      "better-auth_session_token",
      
      // Legacy better_auth cookies with underscore
      "better_auth_session",
      "better_auth.session_token",
      "better_auth.session-token",
      "better_auth_session_token",
      
      // NextAuth cookies
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token",
      "__Secure-next-auth.callback-url",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.csrf-token",
      
      // Generic session cookie
      "session"
    ];
    
    // Try to use BetterAuth API to sign out first
    await auth.api.signOut({ headers: request.headers });
    
    // Create a response that we'll use to clear cookies
    const response = NextResponse.json({ 
      success: true, 
      message: "Successfully signed out" 
    });
    
    // Clear each cookie in the response
    for (const cookieName of cookieNames) {
      // Clear the cookie - setting it to empty with past expiry
      response.cookies.set({
        name: cookieName,
        value: "",
        expires: new Date(0),
        path: "/",
      });
      
      // Also try with secure prefix
      response.cookies.set({
        name: `__Secure-${cookieName}`,
        value: "",
        expires: new Date(0),
        path: "/",
        secure: true
      });
    }
    
    // Additionally, try to remove any cookie with "auth" in its name
    allCookies.forEach(cookie => {
      if (cookie.name.toLowerCase().includes('auth')) {
        response.cookies.set({
          name: cookie.name,
          value: "",
          expires: new Date(0),
          path: "/",
        });
      }
    });
    
    if (isDevelopment) {
      console.log("Cookies cleared in signout route");
    }
    return response;
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sign out" },
      { status: 500 }
    );
  }
}

// Handle GET requests too for flexibility
export async function GET(request: NextRequest) {
  return POST(request);
} 