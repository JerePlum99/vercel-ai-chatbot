import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { Chat } from '@/components/chat/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/chat/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { getSessionUser } from '@/lib/auth/session';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  // Get the session user with helper function
  const user = await getSessionUser();

  if (chat.visibility === 'private') {
    if (!user) {
      return notFound();
    }

    if (user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  // Get cookie store and read model preference
  const cookieStore = await cookies();
  const modelFromCookie = cookieStore.get('chat-model');
  const selectedModel = modelFromCookie?.value || DEFAULT_CHAT_MODEL;

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedChatModel={selectedModel}
        selectedVisibilityType={chat.visibility}
        isReadonly={user?.id !== chat.userId}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
