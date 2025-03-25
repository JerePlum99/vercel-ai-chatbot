import { auth } from '../../(auth)/auth';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth(); // Ensure authentication

  return (
    <div className="container max-w-screen-xl mx-auto">
      {children}
    </div>
  );
} 