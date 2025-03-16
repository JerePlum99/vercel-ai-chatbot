import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

// Dev-only register endpoint - should be disabled in production
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const data = await request.json();
    const { email, name, password = 'dev-password' } = data;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Use Better Auth's built-in signup method
    const result = await auth.api.signUpEmail({
      body: {
        email,
        name: name || email.split('@')[0],
        password: 'dev-password',
        is_admin: true, // Set as admin for dev
        emailVerified: true // Auto-verify for dev
      }
    });

    if (!result.user) {
      throw new Error('Failed to create user');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating dev user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
} 