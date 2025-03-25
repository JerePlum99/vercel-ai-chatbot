import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db/queries";

// Dev-only endpoint to check if a user exists
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
    const { email } = data;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Try to find the user by email
    const user = await getUserByEmail({ email });
    
    return NextResponse.json({ 
      exists: !!user,
      user: user || null
    });
  } catch (error) {
    console.error("Error checking dev user:", error);
    // If there's an error, assume the user doesn't exist
    return NextResponse.json({ exists: false, user: null });
  }
} 