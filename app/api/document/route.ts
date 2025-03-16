import { verifySession } from '@/lib/auth/auth-api';
import { ArtifactKind } from '@/components/chat/artifacts/artifact';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  // Verify user session with BetterAuth
  const { authorized, session, status, message } = await verifySession(request);
  if (!authorized || !session) {
    return new Response(message || 'Unauthorized', { status: status || 401 });
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (!document) {
    return new Response('Not Found', { status: 404 });
  }

  if (document.userId !== session.user.id) {
    return new Response('Unauthorized: Document belongs to another user', { status: 401 });
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  // Verify user session with BetterAuth
  const { authorized, session, status, message } = await verifySession(request);
  if (!authorized || !session) {
    return new Response(message || 'Unauthorized', { status: status || 401 });
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: ArtifactKind } =
    await request.json();

  const document = await saveDocument({
    id,
    content,
    title,
    kind,
    userId: session.user.id,
  });

  return Response.json(document, { status: 200 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { timestamp }: { timestamp: string } = await request.json();

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  // Verify user session with BetterAuth
  const { authorized, session, status, message } = await verifySession(request);
  if (!authorized || !session) {
    return new Response(message || 'Unauthorized', { status: status || 401 });
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (document.userId !== session.user.id) {
    return new Response('Unauthorized: Document belongs to another user', { status: 401 });
  }

  await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return new Response('Deleted', { status: 200 });
}
