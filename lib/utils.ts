import type {
  CoreAssistantMessage,
  CoreToolMessage,
  Message,
  TextStreamPart,
  ToolInvocation,
  ToolSet,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Message as DBMessage, Document } from '@/lib/db/schema';
import { AnyUIPart, ExtendedMessage, TextUIPart, ToolInvocationUIPart, ReasoningUIPart } from '@/lib/ai/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolResultToMessage({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<ExtendedMessage>;
}): Array<ExtendedMessage> {
  return messages.map((message): ExtendedMessage => {
    if (!message.parts) return message;

    const updatedParts = message.parts.map((part): AnyUIPart => {
      if (part.type !== 'tool-invocation') return part;

      const toolResult = toolMessage.content.find(
        (tool) => tool.type === 'tool-result' && tool.toolCallId === part.toolInvocation.toolCallId,
      );

      if (toolResult) {
        return {
          ...part,
          toolInvocation: {
            ...part.toolInvocation,
            state: 'result' as const,
            result: toolResult.result,
          }
        } as ToolInvocationUIPart;
      }

      return part;
    });

    return {
      ...message,
      parts: updatedParts,
    };
  });
}

export function convertToUIMessages(
  messages: Array<DBMessage>,
): Array<ExtendedMessage> {
  return messages.reduce((chatMessages: Array<ExtendedMessage>, message) => {
    if (message.role === 'tool') {
      return addToolResultToMessage({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages,
      });
    }

    const parts: AnyUIPart[] = [];
    let textContent = '';

    if (typeof message.content === 'string') {
      textContent = message.content;
      parts.push({ type: 'text', text: message.content });
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === 'text' && content.text) {
          textContent += content.text;
          parts.push({ type: 'text', text: content.text });
        } else if (content.type === 'tool-call') {
          parts.push({
            type: 'tool-invocation',
            toolInvocation: {
              toolCallId: content.toolCallId!,
              toolName: content.toolName!,
              args: content.args || {},
              state: 'call',
            }
          });
        } else if (content.type === 'reasoning' && content.reasoning) {
          parts.push({ type: 'reasoning', reasoning: content.reasoning });
        }
      }
    } else if (typeof message.content === 'object' && message.content !== null) {
      // Handle new format where content is an object with 'text' and 'parts' fields
      if ('text' in message.content && typeof message.content.text === 'string') {
        textContent = message.content.text;
        parts.push({ type: 'text', text: message.content.text });
      }
      
      if ('parts' in message.content && Array.isArray(message.content.parts)) {
        for (const part of message.content.parts) {
          parts.push(part as AnyUIPart);
        }
      }
    }

    chatMessages.push({
      id: message.id,
      role: message.role as ExtendedMessage['role'],
      content: textContent,
      parts,
    });

    return chatMessages;
  }, []);
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    if (reasoning) {
      // @ts-expect-error: reasoning message parts in sdk is wip
      sanitizedContent.push({ type: 'reasoning', reasoning });
    }

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function sanitizeUIMessages(messages: Array<ExtendedMessage>): Array<ExtendedMessage> {
  return messages.map((message) => {
    if (!message.parts) return message;

    // Get all tool call IDs that have results
    const toolResultIds = message.parts
      .filter((part): part is ToolInvocationUIPart => 
        part.type === 'tool-invocation' && part.toolInvocation.state === 'result'
      )
      .map(part => part.toolInvocation.toolCallId);

    // Filter parts to only include:
    // 1. Text parts with content
    // 2. Tool calls that have results
    // 3. Reasoning parts
    const sanitizedParts = message.parts.filter((part) => {
      if (part.type === 'text') {
        return (part as TextUIPart).text.length > 0;
      }
      if (part.type === 'tool-invocation') {
        const toolPart = part as ToolInvocationUIPart;
        return toolPart.toolInvocation.state === 'result' || toolResultIds.includes(toolPart.toolInvocation.toolCallId);
      }
      if (part.type === 'reasoning') {
        return true;
      }
      return false;
    });

    return {
      ...message,
      parts: sanitizedParts,
    };
  }).filter((message) => 
    message.content.length > 0 || (message.parts && message.parts.length > 0)
  );
}

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}
