'use client';

import type { ChatRequestOptions } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useEffect } from 'react';
import equal from 'fast-deep-equal';

import type { Vote } from '@/lib/db/schema';
import type { 
  ExtendedMessage, 
  AnyUIPart, 
  ToolInvocationUIPart,
  WeatherAtLocation,
  ReasoningUIPart,
  DocumentResult
} from '@/lib/ai/types';
import type { CompanyResponse } from '@FiveElmsCapital/five-elms-ts-sdk';
import type { SearchResponse, AnswerResponse } from '@/lib/types/exa';
import type { ArtifactKind } from './artifact';

import { DocumentToolCall, DocumentToolResult } from './document';
import {
  ChevronDownIcon,
  LoaderIcon,
  PencilEditIcon,
  SparklesIcon,
} from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './tools/default/weather';
import { CompanyProfile } from './tools/custom/company-profile';
import { 
  ExaSearchResult, 
  ExaAnswerResult,
  ExaFindSimilarResult,
  ExaGetContentsResult 
} from './tools/default/exa-search';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';

// Define which tools should appear below the message (artifact manipulation tools)
const ARTIFACT_TOOLS = ['createDocument', 'updateDocument', 'requestSuggestions'];

// Helper function to check if result is of a specific type
const isWeatherResult = (result: any): result is WeatherAtLocation => {
  return result && 'latitude' in result && 'longitude' in result;
};

const isCompanyProfileResult = (result: any): result is { profile: CompanyResponse; summary: string } => {
  return result && 'profile' in result && 'summary' in result;
};

const isSearchResponse = (result: any): result is SearchResponse => {
  return result && 'results' in result;
};

const isAnswerResponse = (result: any): result is AnswerResponse => {
  return result && 'answer' in result && 'sources' in result;
};

const isDocumentResult = (result: any): result is DocumentResult => {
  return result && 'id' in result && 'title' in result && 'kind' in result;
};

// Helper to check if args has title property
const hasTitle = (args: Record<string, unknown>): args is { title: string } => {
  return args && typeof args.title === 'string';
};

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  dataStream,
}: {
  chatId: string;
  message: ExtendedMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: (
    messages: ExtendedMessage[] | ((messages: ExtendedMessage[]) => ExtendedMessage[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
  dataStream?: any;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Extract tool calls from parts property
  const toolCalls = message.parts?.filter(
    (part): part is ToolInvocationUIPart => part.type === 'tool-invocation'
  ) || [];
  
  // Separate tool calls into information tools and artifact tools
  const artifactTools = toolCalls.filter(tool => 
    ARTIFACT_TOOLS.includes(tool.toolInvocation.toolName)
  );
  const infoTools = toolCalls.filter(tool => 
    !ARTIFACT_TOOLS.includes(tool.toolInvocation.toolName)
  );

  // Find reasoning part if it exists
  const reasoningPart = message.parts?.find(
    (part): part is ReasoningUIPart => part.type === 'reasoning'
  );

  // Check for streaming tool calls in dataStream
  useEffect(() => {
    if (dataStream && message.id === dataStream.id) {
      // The current message is being updated with streaming data
      console.log('Streaming data update for message:', message.id);
    }
  }, [dataStream, message.id]);

  return (
    <AnimatePresence>
      <motion.div
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div className={cn(
          'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
          {
            'w-full': mode === 'edit',
            'group-data-[role=user]/message:w-fit': mode !== 'edit',
          },
        )}>
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full">
            {/* Information tools that appear above content */}
            {infoTools.length > 0 && (
              <div className="flex flex-col gap-4">
                {infoTools.map((toolCall) => {
                  const { toolName, toolCallId, state, args, result } = toolCall.toolInvocation;

                  // Handle partial-call state (tool is being generated)
                  if (state === 'partial-call') {
                    return (
                      <div key={toolCallId} className="animate-pulse">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="animate-spin"><LoaderIcon size={16} /></span>
                          Calling {toolName}...
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle call state (tool call is complete but not executed)
                  if (state === 'call') {
                    return (
                      <div key={toolCallId} className="animate-pulse">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="animate-spin"><LoaderIcon size={16} /></span>
                          Running {toolName}...
                        </div>
                      </div>
                    );
                  }

                  if (state === 'result' && result) {
                    return (
                      <div key={toolCallId}>
                        {toolName === 'getWeather' && isWeatherResult(result) ? (
                          <Weather weatherAtLocation={result} />
                        ) : toolName === 'getCompanyProfile' && isCompanyProfileResult(result) ? (
                          <CompanyProfile profile={result} />
                        ) : toolName === 'exaSearch' || toolName === 'exaSearchAndContents' ? (
                          isSearchResponse(result) && <ExaSearchResult title="Web Search Results" response={result} />
                        ) : toolName === 'exaFindSimilar' ? (
                          isSearchResponse(result) && <ExaFindSimilarResult title="Similar Pages" response={result} />
                        ) : toolName === 'exaGetContents' ? (
                          isSearchResponse(result) && <ExaGetContentsResult title="Page Contents" response={result} />
                        ) : toolName === 'exaAnswer' && isAnswerResponse(result) ? (
                          <ExaAnswerResult title="AI Answer" answer={result.answer} sources={result.sources} />
                        ) : (
                          <pre>{JSON.stringify(result, null, 2)}</pre>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather', 'getCompanyProfile'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'getCompanyProfile' ? (
                        <CompanyProfile isLoading={true} />
                      ) : toolName === 'exaSearch' || toolName === 'exaSearchAndContents' || toolName === 'exaFindSimilar' || toolName === 'exaGetContents' || toolName === 'exaAnswer' ? (
                        <div className="h-24 animate-pulse bg-muted rounded-lg" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Message content and attachments */}
            {message.experimental_attachments && (
              <div className="flex flex-row justify-end gap-2">
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {/* Display reasoning if present in parts */}
            {reasoningPart && (
              <MessageReasoning
                isLoading={isLoading}
                reasoning={reasoningPart.reasoning}
              />
            )}

            {(typeof message.content === 'string' || reasoningPart) && mode === 'view' && (
              <div className="flex flex-row gap-2 items-start">
                {message.role === 'user' && !isReadonly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                        onClick={() => {
                          setMode('edit');
                        }}
                      >
                        <PencilEditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit message</TooltipContent>
                  </Tooltip>
                )}

                <div className={cn('flex flex-col gap-4', {
                  'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                    message.role === 'user',
                })}>
                  {typeof message.content === 'string' && <Markdown>{message.content}</Markdown>}
                </div>
              </div>
            )}

            {message.content && mode === 'edit' && (
              <div className="flex flex-row gap-2 items-start">
                <div className="size-8" />
                <MessageEditor
                  key={message.id}
                  message={message as any} // Temporary type cast to fix linter error
                  setMode={setMode}
                  setMessages={setMessages as any} // Temporary type cast to fix linter error
                  reload={reload}
                />
              </div>
            )}

            {/* Artifact tools that appear below content */}
            {artifactTools.length > 0 && (
              <div className="flex flex-col gap-4">
                {artifactTools.map((toolCall) => {
                  const { toolName, toolCallId, state, args, result } = toolCall.toolInvocation;

                  // Handle partial-call state (tool is being generated)
                  if (state === 'partial-call') {
                    return (
                      <div key={toolCallId} className="animate-pulse">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="animate-spin"><LoaderIcon size={16} /></span>
                          Preparing document...
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle call state (tool call is complete but not executed)
                  if (state === 'call') {
                    return (
                      <div key={toolCallId} className="animate-pulse">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="animate-spin"><LoaderIcon size={16} /></span>
                          {toolName === 'createDocument' ? 'Creating document...' :
                           toolName === 'updateDocument' ? 'Updating document...' :
                           toolName === 'requestSuggestions' ? 'Getting suggestions...' :
                           `Processing ${toolName}...`}
                        </div>
                      </div>
                    );
                  }

                  if (state === 'result' && result) {
                    return (
                      <div key={toolCallId}>
                        {toolName === 'createDocument' && isDocumentResult(result) ? (
                          <DocumentPreview
                            isReadonly={isReadonly}
                            result={result}
                          />
                        ) : toolName === 'updateDocument' && isDocumentResult(result) ? (
                          <DocumentToolResult
                            type="update"
                            result={result}
                            isReadonly={isReadonly}
                          />
                        ) : toolName === 'requestSuggestions' && isDocumentResult(result) ? (
                          <DocumentToolResult
                            type="request-suggestions"
                            result={result}
                            isReadonly={isReadonly}
                          />
                        ) : null}
                      </div>
                    );
                  }
                  return (
                    <div key={toolCallId}>
                      {toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' && hasTitle(args) ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' && hasTitle(args) ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// This custom equality function significantly boosts rendering performance
// by avoiding unnecessary re-renders when message content hasn't changed
const areEqual = (prevProps: {
  message: ExtendedMessage;
  isLoading?: boolean;
  dataStream?: any;
  vote?: Vote;
}, nextProps: {
  message: ExtendedMessage;
  isLoading?: boolean;
  dataStream?: any;
  vote?: Vote;
}) => {
  // Compare primary message properties
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (prevProps.message.role !== nextProps.message.role) return false;
  if (prevProps.message.content !== nextProps.message.content) return false;
  
  // Compare parts containing text content
  const prevText = prevProps.message.parts?.filter(p => p.type === 'text')?.map(p => p.text) || [];
  const nextText = nextProps.message.parts?.filter(p => p.type === 'text')?.map(p => p.text) || [];
  if (!equal(prevText, nextText)) return false;
  
  // Compare parts containing tool calls
  const prevTools = prevProps.message.parts?.filter(p => p.type === 'tool-invocation') || [];
  const nextTools = nextProps.message.parts?.filter(p => p.type === 'tool-invocation') || [];
  if (!equal(prevTools, nextTools)) return false;
  
  // Compare vote and loading status
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (!equal(prevProps.vote, nextProps.vote)) return false;
  
  // Compare dataStream
  if (!equal(prevProps.dataStream, nextProps.dataStream)) return false;
  
  return true;
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  areEqual
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
