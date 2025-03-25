// Client-side auth utilities
import { createAuthClient } from "better-auth/react";

// Create and export BetterAuth client
export const authClient = createAuthClient();

// Export the client utilities for use in components
export const { 
  useSession,
  signIn,
  signOut
} = authClient; 