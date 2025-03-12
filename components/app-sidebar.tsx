'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode } from 'react';

import { PlusIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface AppSidebarProps {
  user: User | undefined;
  title?: string;
  showNewChat?: boolean;
  children?: ReactNode;
}

export function AppSidebar({ user, title = 'Chatbot', showNewChat = false, children }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                {title}
              </span>
            </Link>
            
            {showNewChat && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push('/chat');
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">New Chat</TooltipContent>
              </Tooltip>
            )}
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {children}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
