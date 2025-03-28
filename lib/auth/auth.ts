import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from '../db/schema';

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is not set');
}

export const auth = betterAuth({
  // Add secret for encryption and session handling
  secret: process.env.BETTER_AUTH_SECRET,
  // Database configuration
  database: drizzleAdapter(db, {
    provider: 'pg',
    // Map model names to schema objects using lowercase to match schema definitions
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  // Add advanced configuration
  advanced: {
    generateId: false, // Let the database generate UUIDs instead of BetterAuth
    useSecureCookies: process.env.NODE_ENV !== 'development',
    // Let Better Auth handle the cookie prefix
    cookiePrefix: 'better-auth',
    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          sameSite: "lax",
          path: "/"
        }
      }
    }
  }, 
  // User model configuration
  user: {
    modelName: "user",
    additionalFields: {
      is_admin: {
        type: "boolean",
        defaultValue: false,
      }
    }
  },
  // Account configuration
  account: {
    modelName: "account",
    accountLinking: {
      enabled: true, // Enable account linking
      trustedProviders: ["google"], // Consider Google a trusted provider
    }
  },
  // Verification configuration
  verification: {
    modelName: "verification",
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
  
  // Essential callback for admin status and debug logging
  callbacks: {
    session: async ({ session, user }: { session: any; user: any }) => {
      console.log('[Auth Debug] Session callback executing:', {
        hasSession: !!session,
        hasUser: !!user,
        environment: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        cookieConfig: {
          name: "better-auth.session_token",
          secure: process.env.NODE_ENV !== 'development',
          sameSite: 'lax',
          path: '/'
        }
      });
      
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