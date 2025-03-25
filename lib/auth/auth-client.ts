// Client-side auth utilities
import { createAuthClient } from "better-auth/react";

const base_url = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;

// Log the client configuration
if (typeof window !== 'undefined') {
  console.info('Auth Client Configuration:', {
    base_url,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    window_origin: window.location.origin
  });
}

// Create and export BetterAuth client
export const authClient = createAuthClient({
  baseURL: base_url
});

// Export the client utilities for use in components
export const { 
  signIn,
  signOut,
  useSession,
  signUp 
} = authClient; 