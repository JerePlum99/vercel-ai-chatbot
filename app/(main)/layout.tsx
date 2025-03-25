import { AppNav } from '@/components/app-nav';
import { auth } from '@clerk/nextjs/server';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const { userId } = await auth();

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <div className="flex flex-col h-screen">
        <AppNav />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
} 