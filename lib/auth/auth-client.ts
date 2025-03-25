// Client-side auth utilities
import { createAuthClient } from "better-auth/react";

const base_url = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;

// Create and export BetterAuth client
export const authClient = createAuthClient({
  baseURL: `${base_url}/api/auth`
});

// Export the client utilities for use in components
export const { 
  useSession,
  signIn,
  signOut
} = authClient; 