'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useDeepResearch } from '@/components/chat/tools/default/deep-research-context';
import { ResearchProgress } from './tools/default/research-progress';

interface EmbeddedDeepResearchProps {
  className?: string;
  afterUserMessage?: boolean;
}

export function EmbeddedDeepResearch({ className, afterUserMessage }: EmbeddedDeepResearchProps) {
  const { state } = useDeepResearch();
  const [expanded, setExpanded] = useState(false);
  
  if (!state.isActive) {
    return null;
  }

  // For progress bar only display under user message
  if (afterUserMessage) {
    return <ResearchProgress inMessage={true} />;
  }

  return (
    <div className={cn(
      "fixed right-4 w-80 bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg p-4 flex flex-col overflow-hidden z-10",
      expanded ? "max-h-[80vh]" : "max-h-[250px]",
      className
    )}
    style={{ top: "calc(4rem + 8px)" }} // Position below header with small gap
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-medium">Deep Research in Progress</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="h-8 w-8 p-0"
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
      
      <ResearchProgress inMessage={false} />
      
      {expanded && (
        <Tabs defaultValue="activity" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>
          <TabsContent value="activity" className="max-h-[calc(70vh-180px)] overflow-y-auto">
            <div className="space-y-2 pt-2">
              {state.activity.map((activity, i) => (
                <div key={i} className="text-sm border-l-2 border-gray-200 pl-3 py-1">
                  <div className="flex justify-between">
                    <span className={cn(
                      "font-medium",
                      activity.status === 'complete' ? "text-green-600" : 
                      activity.status === 'error' ? "text-red-600" : 
                      "text-blue-600"
                    )}>
                      {activity.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{activity.message}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="sources" className="max-h-[calc(70vh-180px)] overflow-y-auto">
            <div className="space-y-3 pt-2">
              {state.sources.map((source, i) => (
                <div key={i} className="text-sm">
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {source.title || source.url}
                  </a>
                  <p className="text-gray-500 text-xs truncate">{source.url}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 