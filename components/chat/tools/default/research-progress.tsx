'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileSearch, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useDeepResearch } from '@/components/chat/tools/default/deep-research-context';
import { calculateProgressPercentage } from '@/lib/utils';

interface ResearchProgressProps {
  inMessage?: boolean;
}

export function ResearchProgress({ inMessage = true }: ResearchProgressProps) {
  const { state } = useDeepResearch();
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!state.isActive || state.totalExpectedSteps === 0) {
    return null;
  }
  
  // Use the shared utility function for consistent progress calculation
  const progressPercentage = calculateProgressPercentage(
    state.completedSteps,
    state.totalExpectedSteps
  );
  
  // For display inside messages (like other tools)
  if (inMessage) {
    return (
      <Card className="w-full p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="size-5 text-blue-500" />
            <h3 className="font-medium">Deep Research</h3>
            <Badge variant="secondary" className="ml-2">
              {progressPercentage}% complete
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto"
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Step {state.completedSteps} of {state.totalExpectedSteps}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        {isExpanded && (
          <div className="space-y-4 mt-2">
            <div className="text-sm text-gray-600">
              {state.activity.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium">Latest Activity:</h4>
                  <ul className="space-y-1">
                    {state.activity.slice(-3).map((activity, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Badge variant={activity.status === 'complete' ? 'secondary' : 
                                      activity.status === 'error' ? 'destructive' : 
                                      'outline'} 
                               className="mt-0.5">
                          {activity.type}
                        </Badge>
                        <span className="text-sm">{activity.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>Conducting deep research on your topic...</p>
              )}
              
              {state.sources.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium">Sources Found:</h4>
                  <p className="text-sm text-muted-foreground">Found {state.sources.length} relevant sources.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  }
  
  // For the sidebar panel display
  return (
    <div className="flex flex-col gap-2 mt-2 mb-4 w-full px-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Research in progress...</span>
        <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
} 