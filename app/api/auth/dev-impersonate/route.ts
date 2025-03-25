import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Only allow in non-production environments
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const { email, name } = await request.json();

    // Create the user with admin privileges using Better Auth's server API
    await auth.api.signUpEmail({
      body: {
        email,
        name: name || email.split('@')[0],
        password: 'dev-password',
        is_admin: true,
        emailVerified: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // If user already exists, that's fine - we'll handle it client-side
    if (error.message?.includes('already exists')) {
      return NextResponse.json({ success: true });
    }

    console.error('Dev impersonation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
} 