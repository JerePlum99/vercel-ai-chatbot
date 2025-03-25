import { cookies } from 'next/headers';
import { AppNav } from '@/components/app-nav';
import { getSessionUser } from '@/lib/auth/session';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session using the simplified helper
  const [user, cookieStore] = await Promise.all([
    getSessionUser(), 
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
        <AppNav user={user} />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
} 