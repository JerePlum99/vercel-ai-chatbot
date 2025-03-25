'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';

// This is a development-only component for impersonating users
export function DevImpersonateForm() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // For development, we'll use a passwordless sign-in
      // In a real implementation, you would need to handle this differently
      // This is just for development testing
      if (!signIn) {
        throw new Error("SignIn not available");
      }

      const response = await fetch(`/api/dev-impersonate?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        router.push('/');
        router.refresh();
      } else {
        setError(data.message || 'Failed to impersonate user');
      }
    } catch (error) {
      setError('An error occurred');
      console.error(error);
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
        {isLoading ? 'Impersonating...' : 'Impersonate User'}
      </button>
    </form>
  );
} 