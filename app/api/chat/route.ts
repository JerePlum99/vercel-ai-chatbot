import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { myProvider } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { isValidSession } from '@/lib/auth/auth-types';

import { generateTitleFromUserMessage } from '../actions';
import { createDocument } from '@/lib/ai/tools/artifacts/create-document';
import { updateDocument } from '@/lib/ai/tools/artifacts/update-document';
import { requestSuggestions } from '@/lib/ai/tools/artifacts/request-suggestions';
import { getWeather } from '@/lib/ai/tools/default/get-weather';
import { getCompanyProfile } from '@/lib/ai/tools/custom/get-company-profile';
import { 
  exaSearch, 
  exaSearchAndContents, 
  exaFindSimilar,
  exaGetContents,
  exaAnswer 
} from '@/lib/ai/tools/default/exa-search';

// Maximum duration for the API route execution in seconds
export const maxDuration = 60;

export async function POST(request: Request) {
  // Log environment and request information
  console.info('Chat API Environment:', {
    base_url: process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
    request_url: request.url,
    request_headers: Object.fromEntries(request.headers)
  });

  const {
    id,
    messages,
    selectedChatModel,
  }: { id: string; messages: Array<Message>; selectedChatModel: string } =
    await request.json();

  // Verify user authentication with Better Auth
  const session = await auth.api.getSession({
    headers: request.headers
  });

  // Log session information
  console.info('Chat API Session:', {
    hasSession: !!session,
    isValid: isValidSession(session),
    userId: session?.user?.id,
    sessionExpiry: session?.session?.expiresAt
  });

  if (!isValidSession(session)) {
    return new Response('Unauthorized or session expired', { status: 401 });
  }

  const userMessage = getMostRecentUserMessage(messages);
  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  try {
    const chat = await getChatById({ id });
    if (!chat) {
      console.log(`Creating new chat with ID: ${id} for user: ${session.user.id}`);
      const title = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({ id, userId: session.user.id, title });
    } else {
      console.log(`Restoring existing chat with ID: ${id} for user: ${session.user.id}`);
      if (chat.userId !== session.user.id) {
        console.error(`Chat ownership mismatch. Chat belongs to ${chat.userId} but request from ${session.user.id}`);
        return new Response('Unauthorized: Chat belongs to another user', { status: 401 });
      }
    }

    // Save the user's message to the database
    await saveMessages({
      messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
    });

    // Create and return a streaming response
    return createDataStreamResponse({
      execute: (dataStream) => {
        // Configure and initiate the AI text stream
        const result = streamText({
          // Select the AI model based on user preference
          model: myProvider.languageModel(selectedChatModel),
          // Set the system prompt for the AI
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          // Configure available AI tools based on the model
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []  // No tools for reasoning model
              : [   // Standard tools for other models
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                  'getCompanyProfile',
                  'exaSearch',
                  'exaSearchAndContents',
                  'exaFindSimilar',
                  'exaGetContents',
                  'exaAnswer'
                ],
          // Configure stream processing
          experimental_transform: smoothStream({ chunking: 'word' }), // Word-by-word streaming
          experimental_generateMessageId: generateUUID,  // Unique ID for each message
          
          // Tool definitions with access to session and dataStream
          tools: {
            getWeather, // Weather information tool
            createDocument: createDocument({ session, dataStream }), // Document creation tool
            updateDocument: updateDocument({ session, dataStream }), // Document update tool
            requestSuggestions: requestSuggestions({  // Suggestions tool
              session,
              dataStream,
            }),
            getCompanyProfile, // Five Elms company profile tool
            exaSearch,
            exaSearchAndContents,
            exaFindSimilar,
            exaGetContents,
            exaAnswer
          },

          // Handle stream completion
          onFinish: async ({ response, reasoning }) => {
            // Re-verify session is still valid before saving
            if (isValidSession(session)) {
              try {
                // Clean and prepare messages for storage
                const sanitizedResponseMessages = sanitizeResponseMessages({
                  messages: response.messages,
                  reasoning,
                });

                // Save AI responses to the database
                await saveMessages({
                  messages: sanitizedResponseMessages.map((message) => {
                    return {
                      id: message.id,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  }),
                });
              } catch (error) {
                console.error('Failed to save chat responses:', error);
              }
            }
          },

          // Enable telemetry for monitoring
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'stream-text',
          },
        });

        // Process and merge the stream
        result.consumeStream();
        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true, // Include AI reasoning in the response
        });
      },
      onError: (error) => {
        console.error('Error in chat stream:', error);
        return 'Oops, an error occurred while processing your request!';
      },
    });
  } catch (error) {
    console.error('Chat POST handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * DELETE handler for the chat API endpoint
 * Handles chat deletion requests
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found: Missing chat ID', { status: 404 });
  }

  // Verify user authentication with Better Auth
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!isValidSession(session)) {
    return new Response('Unauthorized or session expired', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });
    if (!chat) {
      return new Response('Not Found: Chat does not exist', { status: 404 });
    }
    
    if (chat.userId !== session.user.id) {
      console.error(`DELETE unauthorized: Chat ${id} belongs to ${chat.userId} but request from ${session.user.id}`);
      return new Response('Unauthorized: Chat belongs to another user', { status: 401 });
    }

    await deleteChatById({ id });
    return new Response('Chat deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Chat DELETE handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
