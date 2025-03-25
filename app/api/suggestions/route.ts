import { verifySession } from '@/lib/auth/auth-api';
import { getSuggestionsByDocumentId } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return new Response('Not Found', { status: 404 });
  }

  // Verify user session with BetterAuth
  const { authorized, session, status, message } = await verifySession(request);
  if (!authorized || !session) {
    return new Response(message || 'Unauthorized', { status: status || 401 });
  }

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if (suggestion.userId !== session.user.id) {
    return new Response('Unauthorized: Resource belongs to another user', { status: 401 });
  }

  return Response.json(suggestions, { status: 200 });
}
