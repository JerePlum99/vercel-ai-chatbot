import { auth } from '@clerk/nextjs/server';
import { createOrUpdateUserFromClerk, getUserByClerkId } from './db/queries';

export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return null;
  }
  
  // Get user from database by Clerk ID
  try {
    const user = await getUserByClerkId(clerkId);
    
    if (!user) {
      // If the user doesn't exist in our database yet, create them
      // This shouldn't typically happen, but it's a safety measure
      // Usually, the webhook should create the user first
      const clerkUser = await auth();
      if (clerkUser.userId) {
        // Get user details from Clerk
        const userData = {
          clerkId: clerkUser.userId,
          email: clerkUser.sessionClaims?.email as string,
          name: clerkUser.sessionClaims?.name as string
        };
        
        // Create user in our database
        const [newUser] = await createOrUpdateUserFromClerk(userData);
        return newUser;
      }
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
} 