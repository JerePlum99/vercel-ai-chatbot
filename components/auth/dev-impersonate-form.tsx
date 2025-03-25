'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth/auth-client';

export function DevImpersonateForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // // First try to create the user through our API route
      // const response = await fetch('/api/auth/dev-impersonate', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     email,
      //     name: name || email.split('@')[0],
      //   }),
      // });

      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.error || 'Failed to create user');
      // }

      // Then sign in using Better Auth's client
      await signIn.email({
        email,
        password: 'dev-password',
        callbackURL: '/chat'
      });
    } catch (error: any) {
      // If user already exists, just try to sign in
      if (error.message?.includes('already exists')) {
        await signIn.email({
          email,
          password: 'dev-password',
          callbackURL: '/chat'
        });
      } else {
        setError(error?.message || 'Authentication failed');
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter user email to impersonate"
          required
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-md"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter user name (optional)"
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
      
      <button
        type="submit"
        disabled={isLoading || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'}
        className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
      >
        {isLoading ? 'Impersonating...' : 'Impersonate User'}
      </button>
    </form>
  );
} 