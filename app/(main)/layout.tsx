import { cookies, headers } from 'next/headers';
import { AppNav } from '@/components/app-nav';
import { auth } from '@/lib/auth/auth';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session and cookies in parallel
  const [session, cookieStore] = await Promise.all([
    auth.api.getSession({
      headers: await headers()
    }),
    cookies()
  ]);

  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <div className="flex flex-col h-screen">
        <AppNav user={session?.user} />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
} 