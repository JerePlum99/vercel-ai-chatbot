// Client-side auth utilities
import { createAuthClient } from "better-auth/react";

// Create and export BetterAuth client
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth` 
    : 'http://localhost:3000/api/auth' // Fallback for SSR context
});

// Export the client utilities for use in components
export const { 
  useSession,
  signIn,
  signOut
} = authClient; 