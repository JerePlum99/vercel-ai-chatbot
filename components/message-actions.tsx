import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';
import type { ExtendedMessage } from '@/lib/ai/types';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import equal from 'fast-deep-equal';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
}: {
  chatId: string;
  message: ExtendedMessage;
  vote: Vote | undefined;
  isLoading: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;
  if (message.parts?.some(part => part.type === 'tool-invocation')) return null;

  return (
    <div className="flex flex-row gap-2 items-center">
      <Button
        variant="ghost"
        className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
        onClick={async () => {
          await copyToClipboard(message.content as string);
          toast.success('Message copied to clipboard!');
        }}
      >
        <CopyIcon />
      </Button>

      <div className="flex flex-row gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
              onClick={async () => {
                await fetch('/api/vote', {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: vote?.type === 'up' ? null : 'up',
                  }),
                });

                mutate(`/api/vote?chatId=${chatId}`);
              }}
            >
              <ThumbUpIcon
                className={vote?.type === 'up' ? 'text-green-500' : ''}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>This was helpful</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
              onClick={async () => {
                await fetch('/api/vote', {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: vote?.type === 'down' ? null : 'down',
                  }),
                });

                mutate(`/api/vote?chatId=${chatId}`);
              }}
            >
              <ThumbDownIcon
                className={vote?.type === 'down' ? 'text-red-500' : ''}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>This was not helpful</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    return true;
  },
);
