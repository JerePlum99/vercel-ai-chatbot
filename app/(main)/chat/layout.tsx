import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarHistory } from '@/components/chat/sidebar/sidebar-history';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSessionUser } from '@/lib/auth/session';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function Layout({
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
      <div className="flex h-full">
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={user} title="Chat" showNewChat>
            <SidebarHistory user={user} />
          </AppSidebar>
          <SidebarInset className="flex-1">{children}</SidebarInset>
        </SidebarProvider>
      </div>
    </>
  );
}
