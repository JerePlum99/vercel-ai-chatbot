'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { ArtifactKind } from './artifacts/artifact';
import { Suggestion } from '@/lib/db/schema';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { useUserMessageId } from '@/hooks/use-user-message-id';
import { useDeepResearch } from '@/components/chat/tools/default/deep-research-context';

type DeepResearchOutput = {
  text: string;
  format: string;
  createArtifact: boolean;
  topic: string;
};

type DataStreamDelta = {
  type:
    | 'text-delta'
    | 'code-delta'
    | 'spreadsheet-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'user-message-id'
    | 'kind'
    | 'activity-delta'
    | 'source-delta'
    | 'message'
    | 'progress-init';
  content:
    | string
    | Suggestion
    | DeepResearchOutput
    | {
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
      }
    | {
        url: string;
        title: string;
        relevance: number;
        description?: string;
      }
    | {
        role: string;
        content: string;
        id: string;
      };
  data?: any;
};

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const { setUserMessageIdFromServer } = useUserMessageId();
  const { setArtifact } = useArtifact();
  const { 
    state, 
    addActivity, 
    addSource, 
    setActive,
    updateProgress,
    initProgress,
    clearState 
  } = useDeepResearch();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'user-message-id') {
        setUserMessageIdFromServer(delta.content as string);
        return;
      }

      // Handle deep research progress initialization
      if (delta.type === 'progress-init') {
        const progressData = delta.content as any;
        if (progressData.totalSteps) {
          setActive(true);
          initProgress(progressData.maxDepth || 5, progressData.totalSteps);
        }
        return;
      }

      // Handle deep research completion
      if (delta.type === 'finish') {
        // Check if this is a deep research result
        const content = delta.content;
        if (content && typeof content === 'object' && 'format' in content && content.format === 'markdown') {
          // Handle final research report
          const researchOutput = content as DeepResearchOutput;
          
          // If a document is created on the server side, we'll get a message event
          // Otherwise, we'll display the research output directly
          if (!researchOutput.createArtifact) {
            // Set a timeout to ensure the active state persists just long enough
            // for the user to see the completion
            setTimeout(() => {
              setActive(false);
              clearState();
            }, 3000);
          }
        } else {
          // Handle regular artifact completion
          setArtifact((draftArtifact) => ({
            ...draftArtifact,
            status: 'idle',
          }));
        }
        return;
      }

      // Handle message from deep research
      if (delta.type === 'message') {
        // This indicates the research has been processed and added to chat
        // We can now reset the deep research state
        setTimeout(() => {
          setActive(false);
          clearState();
        }, 2000);
        return;
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'id':
            return {
              ...draftArtifact,
              documentId: delta.content as string,
              status: 'streaming',
            };

          case 'title':
            return {
              ...draftArtifact,
              title: delta.content as string,
              status: 'streaming',
            };

          case 'kind':
            return {
              ...draftArtifact,
              kind: delta.content as ArtifactKind,
              status: 'streaming',
            };

          case 'text-delta':
            return {
              ...draftArtifact,
              content: draftArtifact.content + (delta.content as string),
              isVisible:
                draftArtifact.status === 'streaming' &&
                draftArtifact.content.length > 400 &&
                draftArtifact.content.length < 450
                  ? true
                  : draftArtifact.isVisible,
              status: 'streaming',
            };

          case 'code-delta':
            return {
              ...draftArtifact,
              content: delta.content as string,
              isVisible:
                draftArtifact.status === 'streaming' &&
                draftArtifact.content.length > 300 &&
                draftArtifact.content.length < 310
                  ? true
                  : draftArtifact.isVisible,
              status: 'streaming',
            };
          case 'spreadsheet-delta':
            return {
              ...draftArtifact,
              content: delta.content as string,
              isVisible: true,
              status: 'streaming',
            };

          case 'clear':
            return {
              ...draftArtifact,
              content: '',
              status: 'streaming',
            };

          case 'activity-delta':
            const activity = delta.content as {
              type: 'search' | 'extract' | 'analyze' | 'thought' | 'reasoning' | 'synthesis';
              status: 'pending' | 'complete' | 'error';
              message: string;
              timestamp: string;
              completedSteps?: number;
              totalSteps?: number;
            };
            
            addActivity(activity);
            
            // Update progress if available
            if (activity.completedSteps !== undefined && activity.totalSteps !== undefined) {
              updateProgress(activity.completedSteps, activity.totalSteps);
            }
            
            return {
              ...draftArtifact,
              status: 'streaming',
            };

          case 'source-delta':
            const source = delta.content as {
              url: string;
              title: string;
              relevance: number;
              description?: string;
            };
            addSource({
              url: source.url,
              title: source.title,
              relevance: source.relevance || 1
            });
            return {
              ...draftArtifact,
              status: 'streaming',
            };

          default:
            return draftArtifact;
        }
      });
    });
  }, [
    dataStream,
    setArtifact,
    setUserMessageIdFromServer,
    addActivity,
    addSource,
    setActive,
    updateProgress,
    initProgress,
    clearState
  ]);

  return null;
}