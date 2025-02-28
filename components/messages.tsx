import { ChatRequestOptions, Message } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Overview } from './overview';
import { memo, useMemo } from 'react';
import { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import { ExtendedMessage } from '@/lib/ai/types';

// Create a type adapter function to convert standard AI SDK Message to our ExtendedMessage
const adaptMessageToExtendedMessage = (message: Message): ExtendedMessage => {
  // If the message already has parts, assume it's already an ExtendedMessage
  if ('parts' in message) {
    return message as unknown as ExtendedMessage;
  }
  
  // Create a basic ExtendedMessage from the standard Message
  const extendedMessage: ExtendedMessage = {
    id: message.id,
    role: message.role,
    content: typeof message.content === 'string' ? message.content : '',
    parts: typeof message.content === 'string' 
      ? [{ type: 'text', text: message.content }] 
      : []
  };

  // Add attachments if they exist
  if (message.experimental_attachments) {
    extendedMessage.experimental_attachments = message.experimental_attachments;
  }

  return extendedMessage;
};

interface MessagesProps {
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
  isArtifactVisible: boolean;
  dataStream?: any;
}

function PureMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  dataStream
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Convert all standard AI SDK Messages to our ExtendedMessage format
  const extendedMessages = useMemo(() => 
    messages.map(adaptMessageToExtendedMessage), 
    [messages]
  );

  // Wrapper for setMessages to handle type conversion
  const handleSetExtendedMessages = (
    newMessages: ExtendedMessage[] | ((messages: ExtendedMessage[]) => ExtendedMessage[])
  ) => {
    if (typeof newMessages === 'function') {
      setMessages((prevMessages) => {
        const extendedPrevMessages = prevMessages.map(adaptMessageToExtendedMessage);
        const result = newMessages(extendedPrevMessages);
        return result as unknown as Message[];
      });
    } else {
      setMessages(newMessages as unknown as Message[]);
    }
  };

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
    >
      {messages.length === 0 && <Overview />}

      {extendedMessages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={isLoading && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={handleSetExtendedMessages}
          reload={reload}
          isReadonly={isReadonly}
          dataStream={dataStream}
        />
      ))}

      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (!equal(prevProps.dataStream, nextProps.dataStream)) return false;

  return true;
});
