import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId, sessionId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ authenticated: false, message: 'Not authenticated' }, { status: 401 });
  }
  
  return NextResponse.json({
    authenticated: true,
    userId,
    sessionId
  });
} 