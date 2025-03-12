'use client';

import React from 'react';
import { useDeepResearch } from '@/components/chat/tools/default/deep-research-context';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface DeepResearchButtonProps {
  className?: string;
}

export function DeepResearchButton({ className }: DeepResearchButtonProps) {
  const { state, toggleActive } = useDeepResearch();

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      className={className}
      onClick={() => toggleActive()}
      title={state.isActive ? 'Disable Deep Research' : 'Enable Deep Research'}
    >
      <Search 
        className={`h-5 w-5 ${state.isActive ? 'text-primary' : 'text-muted-foreground'}`} 
      />
    </Button>
  );
} 