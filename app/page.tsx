import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect from root (/) to the chat page
  redirect('/chat');
} 