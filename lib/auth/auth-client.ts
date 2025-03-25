// Client-side auth utilities
import { createAuthClient } from "better-auth/react";

// Define base URL based on environment
export const baseUrl =
  process.env.NODE_ENV === "development"
    ? new URL("http://localhost:3000")
    : new URL(`https://${process.env.VERCEL_URL!}`);

// Log the client configuration
if (typeof window !== 'undefined') {
  console.info('Auth Client Configuration:', {
    baseUrl: baseUrl.toString(),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    window_origin: window.location.origin
  });
}

// Create and export BetterAuth client
export const authClient = createAuthClient({
  baseURL: baseUrl.toString()
});

// Export the client utilities for use in components
export const { 
  signIn,
  signOut,
  useSession,
  signUp 
} = authClient; 