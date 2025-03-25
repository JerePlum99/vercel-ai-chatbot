'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth/auth-client';

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
      // Try to sign in first
      await signIn.email({
        email,
        password: 'dev-password',
        callbackURL: '/chat'
      });
      return; // If sign in succeeds, we're done
    } catch (error: any) {
      // If error is not about user not existing, show the error
      if (!error?.message?.includes('not found')) {
        console.error('Dev sign in error:', error);
        setError(error?.message || 'Authentication failed');
        setIsLoading(false);
        return;
      }

      // User doesn't exist, try to sign up
      try {
        await signUp.email({
          email,
          password: 'dev-password',
          name: name || email.split('@')[0],
          fetchOptions: {
            headers: {
              'X-User-Admin': 'true'
            }
          }
        });

        // After successful signup, sign in
        await signIn.email({
          email,
          password: 'dev-password',
          callbackURL: '/chat'
        });
      } catch (signUpError: any) {
        console.error('Dev sign up error:', signUpError);
        setError(signUpError?.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Only show in development or preview
  const isDevelopment = !process.env.VERCEL_ENV || ['development', 'preview'].includes(process.env.VERCEL_ENV);
  if (!isDevelopment) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email for dev login"
          required
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-md"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name (optional)"
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