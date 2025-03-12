'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeepResearch } from '@/components/chat/tools/default/deep-research-context';

interface DeepResearchProps {
  isActive?: boolean;
  onToggle?: () => void;
  activity?: Array<{
    type:
      | 'search'
      | 'extract'
      | 'analyze'
      | 'reasoning'
      | 'synthesis'
      | 'thought';
    status: 'pending' | 'complete' | 'error';
    message: string;
    timestamp: string;
  }>;
  sources?: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
  deepResearch?: boolean;
}

export function DeepResearch({
  isActive,
  onToggle,
  activity,
  sources,
  deepResearch = true
}: DeepResearchProps) {
  const { state } = useDeepResearch();
  
  // Use props if provided, otherwise use state from context
  const displayActivity = activity || state.activity;
  const displaySources = sources || state.sources;
  
  if ((displayActivity.length === 0 && displaySources.length === 0) || 
      (isActive === false || (isActive === undefined && !state.isActive))) {
    return null;
  }

  return (
    <div className="fixed right-4 top-20 w-80 bg-background border rounded-lg shadow-lg p-4 max-h-[80vh] flex flex-col overflow-hidden">
      <Tabs defaultValue={deepResearch ? "activity" : "sources"} className="flex flex-col h-full">
        <TabsList className="w-full">
          {deepResearch && <TabsTrigger value="activity" className="flex-1">
            Activity
          </TabsTrigger>}
          <TabsTrigger value="sources" className="flex-1">
            Sources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="flex-1 overflow-y-auto mt-2">
          <div className="space-y-4 pr-2 h-full">
            {[...displayActivity].reverse().map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div
                  className={cn(
                    'size-2 rounded-full shrink-0',
                    item.status === 'pending' && 'bg-yellow-500',
                    item.status === 'complete' && 'bg-green-500',
                    item.status === 'error' && 'bg-red-500',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                    {item.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sources" className="flex-1 overflow-y-auto mt-2">
          <div className="space-y-4 pr-2">
            {displaySources.map((source, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1"
              >
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline break-words"
                >
                  {source.title}
                </a>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground truncate">
                    {new URL(source.url).hostname}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}