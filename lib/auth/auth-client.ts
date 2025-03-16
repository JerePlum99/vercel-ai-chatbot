// Client-side auth utilities that don't import server-only code
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";

// Create and export BetterAuth client
export const authClient = createAuthClient({
  // Use full URL format that includes the origin, which will be determined at runtime
  baseURL: typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth` 
    : 'http://localhost:3000/api/auth' // Fallback for SSR context
});

// Base exports from BetterAuth
const { signIn: betterAuthSignIn, useSession } = authClient;

// Enhanced signOut function that also calls our custom endpoint
const signOut = async () => {
  try {
    // First, call the custom signout endpoint that clears all cookies
    await fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Then call the standard BetterAuth signout
    await authClient.signOut();
    
    // If we're in a browser context, redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error };
  }
};

// Hook to manage sign-out with router integration
export function useSignOut() {
  const router = useRouter();
  
  return async () => {
    try {
      await signOut();
      
      // Use router for client-side transitions
      router.push('/login');
      router.refresh();
      
      return { success: true };
    } catch (error) {
      console.error('Error during sign out:', error);
      return { success: false, error };
    }
  };
}

// Export enhanced utilities for client components
export { betterAuthSignIn as signIn, signOut, useSession }; 