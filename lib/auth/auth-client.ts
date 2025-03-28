import { createAuthClient } from "better-auth/react";

let baseUrl: URL;

if (typeof window !== "undefined") {
  // Client-side: use the window location
  baseUrl = new URL(window.location.origin);
} else {
  // Server-side: use env vars
  baseUrl =
    process.env.NODE_ENV === "development"
      ? new URL("http://localhost:3000")
      : new URL(`https://${process.env.VERCEL_URL}`);
}

// Optional: Debug logging only in dev
if (process.env.NODE_ENV === 'development') {
  console.info('Auth Client Configuration:', {
    baseUrl: baseUrl.toString(),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  });
}

// Create BetterAuth client
export const authClient = createAuthClient({
  baseURL: baseUrl.toString(),
});

export const {
  signIn,
  signOut,
  useSession,
  signUp
} = authClient;