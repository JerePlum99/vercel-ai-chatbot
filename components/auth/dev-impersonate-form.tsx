'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth/auth-client';

export function DevImpersonateForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // First attempt to create the user
      // This is a dev-only endpoint we'll create to register users
      const registerResponse = await fetch('/api/auth/dev-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || email.split('@')[0], // Use part of email as name if not provided
          password: 'dev-password', // For dev purposes
        }),
      });

      // Even if registration fails (e.g., user already exists), try to sign in
      await signIn.email({
        email,
        password: 'dev-password', // For dev purposes
        callbackURL: '/chat' // Explicit redirect to /chat instead of root path
      });
      
      // If successful, navigate to the chat page
      router.push('/chat');
      router.refresh();
    } catch (error: any) {
      setError(error?.message || 'Authentication failed');
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
        disabled={isLoading}
        className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
      >
        {isLoading ? 'Impersonating...' : 'Impersonate User'}
      </button>
    </form>
  );
} 