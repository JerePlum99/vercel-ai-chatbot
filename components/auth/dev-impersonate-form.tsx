'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth/auth-client';

const DEV_PASSWORD = process.env.NEXT_PUBLIC_DEV_PASSWORD || 'dev-password';
const isDevelopment = !process.env.VERCEL_ENV || ['development', 'preview'].includes(process.env.VERCEL_ENV);

export function DevImpersonateForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isDevelopment) return null;

  async function tryDevSignIn(email: string, name: string) {
    try {
      await signIn.email({
        email,
        password: DEV_PASSWORD,
        callbackURL: '/chat'
      });
    } catch (error: any) {
      if (!error?.message?.includes('not found')) throw error;

      await signUp.email({
        email,
        password: DEV_PASSWORD,
        name: name || email.split('@')[0],
        fetchOptions: {
          headers: {
            'X-User-Admin': 'true'
          }
        }
      });

      await signIn.email({
        email,
        password: DEV_PASSWORD,
        callbackURL: '/chat'
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await tryDevSignIn(email, name);
    } catch (err: any) {
      console.error('Dev auth error:', err);
      setError(err?.message || 'Authentication failed');
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
          placeholder="Enter email for dev login"
          required
          className="w-full px-3 py-2 border rounded-md"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name (optional)"
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
        disabled={isLoading}
        className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Dev Sign In'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Development Mode: {!process.env.VERCEL_ENV ? 'Local Development' : process.env.VERCEL_ENV}
      </p>
    </form>
  );
}