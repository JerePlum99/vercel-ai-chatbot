import { auth } from '@/lib/auth/auth';
import { getVotesByChatId, voteMessage } from '@/lib/db/queries';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user || !session.user.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const votes = await getVotesByChatId({ id: chatId });

  return Response.json(votes, { status: 200 });
}

export async function POST(request: Request) {
  const { chatId, messageId, isUpvoted } = await request.json();

  if (!chatId || !messageId || isUpvoted === undefined) {
    return new Response('chatId, messageId, and isUpvoted are required', {
      status: 400,
    });
  }

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user || !session.user.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  await voteMessage({ chatId, messageId, type: isUpvoted ? 'up' : 'down' });

  return new Response('OK', { status: 200 });
}
