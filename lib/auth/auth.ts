import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from '../db/schema';

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is not set');
}

const base_url = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;

export const auth = betterAuth({
  // Add secret for encryption and session handling
  secret: process.env.BETTER_AUTH_SECRET,
  
  baseURL: base_url,
  
  // Database configuration
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
  
  // User model configuration
  user: {
    modelName: "User",
    additionalFields: {
      is_admin: {
        type: "boolean",
        defaultValue: false,
      }
    }
  },
  
  // Session configuration
  session: {
    modelName: "Session",
  },
  
  // Account configuration
  account: {
    modelName: "Account",
    accountLinking: {
      enabled: true, // Enable account linking
      trustedProviders: ["google"], // Consider Google a trusted provider
    }
  },
  
  // Verification configuration
  verification: {
    modelName: "Verification",
  },
  
  // OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }
  },
  
  // Email/password authentication
  emailAndPassword: {
    enabled: true,
  },
  
  // Essential callback for admin status
  callbacks: {
    session: async ({ session, user }: { session: any; user: any }) => {
      if (session.user) {
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
  
  // Next.js integration
  plugins: [nextCookies()]
});

// Note: Client-side exports have been moved to lib/auth-client.ts 