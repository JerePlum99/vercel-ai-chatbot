import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from '../db/schema';

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is not set');
}

// Define base URL based on environment
export const baseUrl =
  process.env.NODE_ENV === "development"
    ? new URL("http://localhost:3000")
    : new URL(`https://${process.env.VERCEL_URL!}`);

// Log the server configuration
console.info('Auth Server Configuration:', {
  baseUrl: baseUrl.toString(),
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL
});

// Consider development mode if NODE_ENV is development or VERCEL_ENV is preview
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview';

console.info('Auth Development Mode:', {
  isDevelopment,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV
});

export const auth = betterAuth({
  // Add secret for encryption and session handling
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: baseUrl.toString(),
  
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
        defaultValue: isDevelopment,
      }
    }
  },
  
  // Session configuration
  session: {
    modelName: "Session",
    // Add explicit cookie configuration
    cookie: {
      name: 'auth_session',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
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
    skipVerification: isDevelopment,
    defaultPassword: isDevelopment ? 'dev-password' : undefined,
    // Add explicit configuration for development
    development: {
      enabled: isDevelopment,
      skipVerification: true
    }
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