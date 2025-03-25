import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from '../db/schema';

// Validate the auth secret is set
if (!process.env.BETTER_AUTH_SECRET) {
  console.error(
    'Error: BETTER_AUTH_SECRET is not set. Please set this environment variable.'
  );
  // Don't throw an error in production to avoid crashing, but this should be fixed
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('BETTER_AUTH_SECRET must be provided for Better Auth to function correctly');
  }
}

export const auth = betterAuth({
  // Add secret key from environment variables
  secret: process.env.BETTER_AUTH_SECRET,
  
  // Add base URL for auth endpoints
  baseURL: process.env.BETTER_AUTH_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  
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
    secure: process.env.VERCEL_ENV !== "development",
    sameSite: "lax", // Ensure cookies work with redirects
    path: "/",       // Ensure cookies are available on all paths
    domain: process.env.VERCEL_ENV !== "development" ? undefined : "localhost", // Allow cookies across subdomains in preview/production
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
    // Simplified redirect logic
    redirect: async ({ url, baseUrl }: any) => {
      // If it's an explicit redirect URL, honor it
      if (url && (url.startsWith(baseUrl) || url.startsWith('/'))) {
        return url;
      }
      // Default to home page instead of forcing /chat
      return '/';
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
    signOut: "/login",
    error: "/login"
  },
});

// Note: Client-side exports have been moved to lib/auth-client.ts 