import { getSessionUser } from '@/lib/auth/session';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure authentication using the simplified helper
  const user = await getSessionUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return (
    <div className="container max-w-screen-xl mx-auto">
      {children}
    </div>
  );
} 