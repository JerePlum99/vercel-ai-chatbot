'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
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

export function AppNav() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const { isLoaded, isSignedIn, user } = useUser();
  
  // Define navigation items with paths and labels
  const navItems = [
    { path: '/chat', label: 'Chat' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/settings', label: 'Settings' }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center">
          <Link href="/" className="flex items-center font-semibold text-lg mr-6">
            Chatbot
          </Link>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.path || 
                  (item.path === '/chat' && pathname.startsWith('/chat'))
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        
        {isLoaded && isSignedIn && user && (
          <div className="ml-auto flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <UserButton />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        {isLoaded && !isSignedIn && (
          <div className="ml-auto">
            <Button variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
} 