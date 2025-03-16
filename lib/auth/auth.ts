import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from '../db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    // Map the expected model names to your schema objects
    schema: {
      User: schema.user,      // Use uppercase for the key to match what BetterAuth expects
      Session: schema.session,
      Account: schema.account,
      Verification: schema.verification
    }
  }),
  
  // Add advanced configuration to let DB handle UUID generation
  advanced: {
    generateId: false, // Let the database generate UUIDs instead of BetterAuth
  },
  
  // Configure user model with both name customization and additional fields
  user: {
    modelName: "User", // This tells BetterAuth your table is capitalized
    fields: {
      // Map BetterAuth fields to your schema field names if different
    },
    additionalFields: {
      is_admin: {
        type: "boolean",
        defaultValue: false,
      }
    }
  },
  
  session: {
    modelName: "Session",
  },
  
  account: {
    modelName: "Account",
    accountLinking: {
      enabled: true, // Enable account linking
      trustedProviders: ["google"], // Consider Google a trusted provider
    }
  },
  
  verification: {
    modelName: "Verification",
  },
  
  // Configure OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Map Google profile data to user using BetterAuth's standard mapping
      mapProfileToUser: (profile: any) => {
        return {
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified || false,
        };
      }
    }
  },
  
  // Optionally enable email and password authentication
  emailAndPassword: {
    enabled: true,
  },
  
  // Set cookies and session options
  cookies: {
    prefix: "better-auth",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Ensure cookies work with redirects
    path: "/",       // Ensure cookies are available on all paths
  },
  
  // Callbacks similar to NextAuth
  callbacks: {
    // Invoked when a user signs in
    signIn: async ({ user, account, profile }: any) => {
      console.log("Sign-in callback triggered", { 
        userId: user.id,
        provider: account?.providerId 
      });
      return true; // Allow sign in
    },
    // Added redirect callback for better control of redirects
    redirect: async ({ url, baseUrl }: any) => {
      console.log("Redirect callback", { url, baseUrl });
      // If the URL starts with the base URL or is a relative URL, return it
      if (url.startsWith(baseUrl) || url.startsWith('/')) {
        return url;
      }
      // Default to the chat page
      return '/chat';
    },
    // Invoked whenever a session is checked
    session: async ({ session, user }: any) => {
      // Add custom properties to the session
      if (session.user) {
        session.user.id = user.id;
        session.user.is_admin = user.is_admin || false;
      }
      return session;
    },
  },
  
  // Page URLs
  pages: {
    signIn: "/login",
    signOut: "/login", // Redirect to login page after signing out
    error: "/login", // Error code passed in query string as ?error=
    // Default success redirect
    defaultRedirect: "/chat" // Add this to ensure users go to /chat after authentication
  },
});

// Note: Client-side exports have been moved to lib/auth-client.ts 