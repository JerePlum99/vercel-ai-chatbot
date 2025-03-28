'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import { authClient } from '@/lib/auth/auth-client';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Accept any user object that has the required properties
export function AppNav({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login');
        }
      }
    });
  };

  // Define navigation items with paths and labels
  const navItems = [
    { path: '/chat', label: 'Chat' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/settings', label: 'Settings' }
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center px-4">
        <div className="flex">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold mr-6"
          >
            {/* Logo or App Name */}
            <span>AI Chatbot</span>
          </Link>

          {/* Main Navigation */}
          <div className="hidden sm:flex">
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                href={path}
                className={cn(
                  'flex items-center px-4 text-sm font-medium transition-colors hover:text-primary',
                  pathname === path || pathname.startsWith(`${path}/`)
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {user && (
          <div className="ml-auto flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full h-8 w-8 p-0">
                  <Image
                    src={user.image || `https://avatar.vercel.sh/${user.email}`}
                    alt={user.email ?? 'User Avatar'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.name && <p className="font-medium">{user.name}</p>}
                    {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={handleSignOut}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  );
} 