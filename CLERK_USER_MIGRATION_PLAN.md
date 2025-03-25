# User Data Migration Plan: NextAuth to Clerk

## Overview

This document outlines the steps to migrate user data from our current NextAuth.js implementation to Clerk.

## Prerequisites

1. Set up a Clerk Production instance in the Clerk Dashboard
2. Install the Clerk migration script

## Migration Steps

### 1. Export User Data

Export all user data from our database using the following query:

```sql
SELECT 
  id as userId, 
  email, 
  name, 
  password 
FROM 
  "User"
```

Save the results as a JSON file in the following format:

```json
[
  {
    "userId": "string",
    "email": "email",
    "firstName": "string (optional)",
    "lastName": "string (optional)",
    "password": "string (optional)",
    "passwordHasher": "bcrypt"
  }
]
```

Note: Split the full name into firstName and lastName if needed.

### 2. Set Up Migration Script

```bash
# Clone the migration script
git clone https://github.com/clerk/migration-script.git
cd migration-script

# Create .env file with production Clerk secret key
echo "CLERK_SECRET_KEY=your_production_clerk_secret_key" > .env

# Copy user data file to the migration script directory
cp /path/to/exported-users.json ./users.json

# Run the script
npm install
npm start
```

### 3. Handle Foreign Keys

After migration, we'll need to handle the user ID changes. We have two options:

#### Option 1: Use Clerk's externalId field (Recommended)

In the Clerk Dashboard, go to JWT Templates and add this to the claims:

```json
{
  "userId": "{{user.external_id || user.id}}"
}
```

This will make Clerk use the original database user ID when available.

#### Option 2: Update Database Foreign Keys

Update all tables that reference the user table:

```sql
-- Example: Update Chat table
UPDATE "Chat" 
SET "userId" = (
  SELECT id FROM "ClerkUserMapping" 
  WHERE old_id = "Chat"."userId"
) 
WHERE EXISTS (
  SELECT 1 FROM "ClerkUserMapping" 
  WHERE old_id = "Chat"."userId"
);
```

### 4. Verification

1. Verify users are imported correctly in Clerk Dashboard
2. Test sign-in with migrated accounts
3. Verify access to previously created data
4. Run database queries to ensure all user relations are correct

### 5. Rollback Plan

If issues arise:

1. Keep the NextAuth API routes available but commented out
2. Maintain the ability to switch back to NextAuth if needed
3. Keep a backup of the database before making any schema changes

## Next Steps After Migration

1. Delete Legacy NextAuth code once verified everything works
2. Update all components that use user data to use the Clerk format
3. Consider implementing Clerk webhooks for user management events 