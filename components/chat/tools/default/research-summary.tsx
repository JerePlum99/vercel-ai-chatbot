'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, ExternalLink, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Markdown } from '@/components/chat/message/markdown';
import { calculateProgressPercentage } from '@/lib/utils';

interface Finding {
  text: string;
  source: string;
}

interface ResearchSummaryProps {
  title?: string;
  result: {
    success: boolean;
    data: {
      findings: Finding[];
      analysis: string;
      completedSteps: number;
      totalSteps: number;
      createArtifact: boolean;
      topic: string;
      nextSteps?: string;
    }
  };
  isLoading?: boolean;
}

// Helper function to extract domain from URL or return the original string
function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (e) {
    // If not a valid URL, return the original or a truncated version
    return urlString.length > 30 ? urlString.substring(0, 30) + '...' : urlString;
  }
}

export function ResearchSummary({ 
  title = "Research Summary", 
  result, 
  isLoading = false 
}: ResearchSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (isLoading) {
    return (
      <Card className="w-full p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-blue-500" />
            <h3 className="font-medium">{title}</h3>
            <Badge variant="secondary" className="ml-2">
              Loading
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            disabled
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
        <div className="h-24 animate-pulse bg-muted rounded-lg" />
      </Card>
    );
  }
  
  if (!result || !result.success) {
    return (
      <Card className="w-full p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-red-500" />
            <h3 className="font-medium">Research Failed</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Unable to complete research. Please try again with a different query.
        </p>
      </Card>
    );
  }

  const { findings, analysis, completedSteps, totalSteps, topic } = result.data;
  
  // Use the shared utility function for consistent progress calculation
  const completionPercentage = calculateProgressPercentage(completedSteps, totalSteps);
  
  return (
    <Card className="w-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-blue-500" />
          <h3 className="font-medium">{title}</h3>
          <Badge variant="secondary" className="ml-2">
            {findings.length} sources
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
      
      <div className="text-sm text-gray-600">
        <p>Comprehensive research on: <span className="font-medium">{topic}</span></p>
        <div className="flex items-center gap-2 mt-2">
          <div className="text-xs text-muted-foreground">
            Research completed: {completionPercentage}%
          </div>
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {isExpanded && (
        <Tabs defaultValue="analysis" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="pt-4 pb-1">
            <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-muted-foreground">
              <Markdown>{analysis}</Markdown>
            </div>
          </TabsContent>
          
          <TabsContent value="sources" className="space-y-4 pt-4">
            {findings.map((finding, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-blue-500" />
                    <a
                      href={finding.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {extractDomain(finding.source)}
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Source {index + 1}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{finding.text.slice(0, 300)}...</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
} 