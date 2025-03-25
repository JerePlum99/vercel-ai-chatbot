import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session using Better Auth
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  return (
    <div className="container max-w-screen-xl mx-auto">
      {children}
    </div>
  );
} 