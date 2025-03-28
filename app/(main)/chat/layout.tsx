import { cookies, headers } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarHistory } from '@/components/chat/sidebar/sidebar-history';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/lib/auth/auth';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function Layout({
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
      <div className="flex h-full">
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={session?.user} title="Chat" showNewChat>
            <SidebarHistory user={session?.user} />
          </AppSidebar>
          <SidebarInset className="flex-1">{children}</SidebarInset>
        </SidebarProvider>
      </div>
    </>
  );
}
