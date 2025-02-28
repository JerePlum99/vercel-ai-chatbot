import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
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

import { generateTitleFromUserMessage } from '../../actions';
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

/**
 * POST handler for the chat API endpoint
 * Handles new message submissions and AI responses
 */
export async function POST(request: Request) {
  // Extract chat data from the request body
  const {
    id: chatId,
    messages,
    selectedChatModel
  } = await request.json();

  // Verify user authentication
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  // Get the most recent user message for processing
  const userMessage = getMostRecentUserMessage(messages);
  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  // Create or retrieve chat session
  const chat = await getChatById({ id: chatId });
  if (!chat) {
    // Generate a title for new chat sessions based on the first message
    let title = 'New Chat';
    try {
      const generatedTitle = await generateTitleFromUserMessage({ message: userMessage });
      title = generatedTitle || title;
    } catch (error) {
      console.error('Failed to generate title:', error);
    }
    await saveChat({ id: chatId, userId, title });
  }

  // Save the user's message to the database
  await saveMessages({
    messages: [{ 
      id: userMessage.id, 
      chatId, 
      role: userMessage.role,
      content: userMessage.content,
      createdAt: new Date() 
    }],
  });

  // Create and return a streaming response
  return createDataStreamResponse({
    execute: async (dataStream) => {
      // Configure and initiate the AI text stream
      const result = await streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel }),
        messages,
        maxSteps: 10,
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        experimental_toolCallStreaming: true,
        
        tools: {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
          getCompanyProfile,
          exaSearch,
          exaSearchAndContents,
          exaFindSimilar,
          exaGetContents,
          exaAnswer
        },

        onFinish: async ({ response, reasoning }) => {
          if (!session.user?.id) return;
          
          try {
            // Clean and prepare messages for storage
            const sanitizedResponseMessages = sanitizeResponseMessages({
              messages: response.messages,
              reasoning,
            });

            // Save AI responses to the database with properly formatted content
            await saveMessages({
              messages: sanitizedResponseMessages.map((message) => {
                return {
                  id: message.id,
                  chatId,
                  role: message.role,
                  content: message.content,
                  createdAt: new Date(),
                };
              }),
            });
          } catch (error) {
            console.error('Failed to save chat:', error);
          }
        },
      });

      result.consumeStream();
      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true, // Include AI reasoning in the response
      });
    },
    onError: () => {
      return 'Oops, an error occurred!';
    },
  });
}

/**
 * DELETE handler for the chat API endpoint
 * Handles chat deletion requests
 */
export async function DELETE(request: Request) {
  // Extract chat ID from URL parameters
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  // Verify user authentication
  const session = await auth();
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Verify chat ownership
    const chat = await getChatById({ id });
    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Delete the chat
    await deleteChatById({ id });
    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
