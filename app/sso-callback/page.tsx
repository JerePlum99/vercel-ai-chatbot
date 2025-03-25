'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function processCallback() {
      try {
        await handleRedirectCallback({
          redirectUrl: '/sso-callback',
        });
        router.push('/');
      } catch (error) {
        console.error('Error handling redirect callback:', error);
        router.push('/login');
      }
    }
    
    if (!searchParams.get('error')) {
      processCallback();
    } else {
      router.push('/login');
    }
  }, [handleRedirectCallback, router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Completing authentication...</h1>
        <p className="mt-2">You'll be redirected automatically.</p>
      </div>
    </div>
  );
} 