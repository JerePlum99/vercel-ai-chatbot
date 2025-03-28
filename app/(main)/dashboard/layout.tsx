import { cookies, headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { 
  BarChart3Icon, 
  UsersIcon, 
  SettingsIcon, 
  HomeIcon 
} from 'lucide-react';
import Link from 'next/link';

function DashboardSidebar() {
  const menuItems = [
    { icon: HomeIcon, label: 'Overview', href: '/dashboard' },
    { icon: BarChart3Icon, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: UsersIcon, label: 'Users', href: '/dashboard/users' },
    { icon: SettingsIcon, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="space-y-2 py-2">
      {menuItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted"
        >
          <item.icon className="size-4" />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

export default async function DashboardLayout({
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
    <div className="flex h-full">
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user} title="Dashboard">
          <DashboardSidebar />
        </AppSidebar>
        <SidebarInset className="flex-1">{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
} 