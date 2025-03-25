import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth/session';
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
  // Get session using the simplified helper
  const [user, cookieStore] = await Promise.all([
    getSessionUser(), 
    cookies()
  ]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <div className="flex h-full">
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={user} title="Dashboard">
          <DashboardSidebar />
        </AppSidebar>
        <SidebarInset className="flex-1">{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
} 