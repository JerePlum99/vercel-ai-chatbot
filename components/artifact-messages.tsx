import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Vote } from '@/lib/db/schema';
import { ChatRequestOptions, Message } from 'ai';
import { memo, useMemo } from 'react';
import equal from 'fast-deep-equal';
import { UIArtifact } from './artifact';
import { ExtendedMessage } from '@/lib/ai/types';

interface ArtifactMessagesProps {
  chatId: string;
  isLoading: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
  artifactStatus: UIArtifact['status'];
}

// Reuse adapter from messages.tsx
const adaptMessageToExtendedMessage = (message: Message): ExtendedMessage => {
  if ('parts' in message) return message as unknown as ExtendedMessage;
  return {
    id: message.id,
    role: message.role,
    content: typeof message.content === 'string' ? message.content : '',
    parts: typeof message.content === 'string' ? [{ type: 'text', text: message.content }] : [],
    experimental_attachments: message.experimental_attachments
  };
};

function PureArtifactMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: ArtifactMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const extendedMessages = useMemo(() => 
    messages.map(adaptMessageToExtendedMessage), 
    [messages]
  );

  const handleSetExtendedMessages = (
    newMessages: ExtendedMessage[] | ((messages: ExtendedMessage[]) => ExtendedMessage[])
  ) => {
    if (typeof newMessages === 'function') {
      setMessages((prevMessages) => {
        const extendedPrevMessages = prevMessages.map(adaptMessageToExtendedMessage);
        const result = newMessages(extendedPrevMessages);
        return result.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          experimental_attachments: msg.experimental_attachments
        })) as Message[];
      });
    } else {
      setMessages(newMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        experimental_attachments: msg.experimental_attachments
      })) as Message[]);
    }
  };

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
    >
      {extendedMessages.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          isLoading={isLoading && index === messages.length - 1}
          vote={votes?.find((vote) => vote.messageId === message.id)}
          setMessages={handleSetExtendedMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps,
) {
  if (
    prevProps.artifactStatus === 'streaming' &&
    nextProps.artifactStatus === 'streaming'
  )
    return true;

  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);
