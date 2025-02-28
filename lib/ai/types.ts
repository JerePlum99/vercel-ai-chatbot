import type { Message as AIMessage, Message } from 'ai';
import type { CompanyResponse } from '@FiveElmsCapital/five-elms-ts-sdk';
import type { SearchResponse, SearchAndContentsResponse, AnswerResponse } from '@/lib/types/exa';

// Base interface for all message parts
export interface MessagePart {
  type: string;
}

// Text UI part
export interface TextUIPart extends MessagePart {
  type: 'text';
  text: string;
}

// Weather tool result type
export interface WeatherAtLocation {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
  };
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
  daily_units: {
    time: string;
    sunrise: string;
    sunset: string;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
}

// Document result type
export interface DocumentResult {
  id: string;
  title: string;
  kind: 'text' | 'code' | 'image' | 'sheet';
}

// Search result type
export interface SearchResult {
  results: Array<{
    title: string;
    url: string;
    content: string;
  }>;
}

// Tool call UI part
export interface ToolInvocationUIPart extends MessagePart {
  type: 'tool-invocation';
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: 'partial-call' | 'call' | 'result';
    result?: 
      | WeatherAtLocation 
      | CompanyResponse 
      | SearchResponse 
      | SearchAndContentsResponse 
      | AnswerResponse 
      | DocumentResult
      | Record<string, unknown>;
  };
}

// Reasoning UI part
export interface ReasoningUIPart extends MessagePart {
  type: 'reasoning';
  reasoning: string;
}

// Source UI part (required by AI SDK)
export interface SourceUIPart extends MessagePart {
  type: 'source';
  source: string;
}

// Update Attachment type to match AI SDK
export interface Attachment {
  url: string;
  name?: string;
  type?: string;
}

// Union type of all possible message parts
export type AnyUIPart = TextUIPart | ToolInvocationUIPart | ReasoningUIPart | SourceUIPart;

// Message type with parts
export interface ExtendedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  parts?: AnyUIPart[];
  name?: string;
  experimental_attachments?: Attachment[];
}

// Database message content types
export interface DBMessageContent {
  type: 'text' | 'tool-call' | 'tool-result' | 'reasoning';
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  reasoning?: string;
}

// Database message type
export type DBMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | DBMessageContent[];
  createdAt: Date;
}; 