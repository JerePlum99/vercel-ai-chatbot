import { auth } from '../../(auth)/auth';

export default async function DashboardPage() {
  const session = await auth();
  
  return (
    <div className="container p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Welcome</h2>
          <p className="text-muted-foreground">
            Hello {session?.user?.name || session?.user?.email || 'User'}, welcome to your dashboard!
          </p>
        </div>
        
        <div className="bg-card p-4 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
          <p className="text-muted-foreground">
            No recent activity to display.
          </p>
        </div>
        
        <div className="bg-card p-4 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Statistics</h2>
          <p className="text-muted-foreground">
            This is a placeholder for statistics.
          </p>
        </div>
      </div>
    </div>
  );
} 