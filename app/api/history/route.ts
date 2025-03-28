import { auth } from '@/lib/auth/auth';
import { getChatsByUserId } from '@/lib/db/queries';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  // biome-ignore lint: Forbidden non-null assertion.
  const chats = await getChatsByUserId({ id: session.user.id! });
  return Response.json(chats);
}
