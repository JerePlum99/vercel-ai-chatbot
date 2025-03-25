import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

// Only allow in development/preview
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     process.env.VERCEL_ENV === 'preview';

export async function GET(req: NextRequest) {
  if (!isDevelopment) {
    return NextResponse.json(
      { status: 'failed', message: 'Only available in development' },
      { status: 403 }
    );
  }

  const email = req.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json(
      { status: 'failed', message: 'Email is required' },
      { status: 400 }
    );
  }

  try {
    // Check if the user exists in our database
    const [dbUser] = await getUser(email);
    if (!dbUser) {
      return NextResponse.json(
        { status: 'failed', message: 'User not found in database' },
        { status: 404 }
      );
    }

    // In a complete implementation, you would verify the user exists in Clerk
    // and provide a proper impersonation mechanism
    // This is just a mock success response for development
    return NextResponse.json({
      status: 'success',
      message: 'Development user impersonation simulated',
      userId: dbUser.id
    });
  } catch (error) {
    console.error('Dev impersonation error:', error);
    return NextResponse.json(
      { status: 'failed', message: 'Server error' },
      { status: 500 }
    );
  }
} 