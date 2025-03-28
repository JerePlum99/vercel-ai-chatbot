'use client';

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
import { generateUUID } from '@/lib/utils';

interface AppSidebarProps {
  user: any; // Accept any user object
  title?: string;
  showNewChat?: boolean;
  children?: ReactNode;
}

export function AppSidebar({ user, title = 'Chatbot', showNewChat = false, children }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  // Handler for creating a new chat without full page refresh
  const handleNewChat = () => {
    // Close mobile sidebar if open
    setOpenMobile(false);
    
    // Navigate directly to the chat route (which generates a new UUID internally)
    router.push('/chat');
  };

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
                    onClick={handleNewChat}
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
