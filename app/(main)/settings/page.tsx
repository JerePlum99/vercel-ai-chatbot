import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const user = session?.user;
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="max-w-2xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Manage your account settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="text-muted-foreground">
                {user?.email || 'No email provided'}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <div className="text-muted-foreground">
                {user?.name || 'No name provided'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configure how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications about activity.
                </p>
              </div>
              <input type="checkbox" className="size-4" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in browser.
                </p>
              </div>
              <input type="checkbox" className="size-4" defaultChecked />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 