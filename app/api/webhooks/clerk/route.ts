import type { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createOrUpdateUserFromClerk } from '@/lib/db/queries';

// Extend the webhook event with more specific user data types
type UserEventData = {
  id: string;
  email_addresses?: Array<{
    email_address: string;
    verification?: any;
  }>;
  first_name?: string;
  last_name?: string;
  image_url?: string;
};

export async function POST(req: Request) {
  // Get the headers
  const headersList = headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  // If there are no svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return new Response('Error: Missing webhook secret', {
      status: 500,
    });
  }

  // Verify the webhook
  let event: WebhookEvent;
  
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', {
      status: 400,
    });
  }

  // Handle the webhook event
  try {
    const { type } = event;
    const eventData = event.data as UserEventData;

    switch (type) {
      case 'user.created':
      case 'user.updated':
        if (eventData.email_addresses && eventData.email_addresses.length > 0) {
          const primaryEmail = eventData.email_addresses[0].email_address;

          await createOrUpdateUserFromClerk({
            clerkId: eventData.id,
            email: primaryEmail,
            name: `${eventData.first_name || ''} ${eventData.last_name || ''}`.trim(),
            metadata: {
              emailVerified: eventData.email_addresses[0].verification,
              lastUpdatedAt: new Date().toISOString(),
              avatarUrl: eventData.image_url
            }
          });
        }
        break;
      
      case 'user.deleted':
        // In case of a user deletion, we'll just log it for now
        // You might want to handle user deletion differently
        console.log(`User deleted: ${eventData.id}`);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error processing webhook', {
      status: 500,
    });
  }
} 