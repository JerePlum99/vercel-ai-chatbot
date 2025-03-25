'use client';

import { signOut } from '@/lib/auth/auth-client';

export const SignOutForm = () => {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-left px-1 py-0.5 text-red-500"
    >
      Sign out
    </button>
  );
};
