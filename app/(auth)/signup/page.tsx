'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen relative">
      {/* Left Column - Sign Up */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 bg-background">
        {/* Logo */}
        <div className="absolute top-8 lg:top-12 left-8 lg:left-12">
          <Image
            src="/brand/FEC_Horizontal_Black.png"
            alt="Five Elms Capital"
            width={200}
            height={40}
            priority
            className="dark:invert"
          />
        </div>

        {/* Sign Up Form - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-foreground">Create Account</h1>
              <p className="text-muted-foreground">
                Sign up to get started
              </p>
            </div>
            
            <SignUp 
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-primary hover:bg-primary/90',
                  card: 'bg-transparent shadow-none',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  footerAction: 'text-muted-foreground hover:text-foreground'
                }
              }}
              routing="path"
              path="/signup"
              signInUrl="/login"
              redirectUrl="/"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Five Elms Capital. All rights reserved.
        </div>
      </div>

      {/* Right Column - Visual */}
      <div className="hidden lg:flex w-1/2 bg-muted relative items-center justify-center overflow-hidden">
        <div className="relative size-80">
          <Image
            src="/favicon.ico"
            alt="Five Elms Capital Logo"
            fill
            className="object-contain opacity-15 dark:opacity-[0.50]"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-muted/50 to-muted" />
      </div>
    </div>
  );
} 