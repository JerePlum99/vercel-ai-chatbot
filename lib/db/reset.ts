import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const runReset = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  // Initialize a temporary connection for executing raw SQL
  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Dropping all tables...');

  try {
    // First, get information about the database
    console.log('📊 Getting database information...');
    
    // Check which tables actually exist
    const tablesResult = await connection`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `;
    
    const tableNames = tablesResult.map(row => row.tablename);
    console.log('Found tables:', tableNames);

    // More aggressive approach - drop the entire schema and recreate it
    await connection.unsafe(`
      -- Terminate all connections to the database (except our own)
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = current_database()
        AND pid <> pg_backend_pid();
      
      -- Drop schema with cascade to remove all objects
      DROP SCHEMA public CASCADE;
      
      -- Recreate the public schema
      CREATE SCHEMA public;
      
      -- Grant permissions on the public schema (removed postgres role reference)
      GRANT ALL ON SCHEMA public TO public;
      
      -- Drop Drizzle metadata schema if it exists
      DROP SCHEMA IF EXISTS drizzle CASCADE;
    `);

    // Now that we have a clean schema, let's also clear out the drizzle migrations metadata
    console.log('🧹 Creating drizzle migrations table...');
    await connection.unsafe(`
      -- Create the drizzle migrations table explicitly to ensure we have a clean slate
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamptz DEFAULT now()
      );
    `);

    console.log('✅ Database completely reset');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await connection.end();
  }

  console.log('🔄 Database reset complete. Now you can rebuild your schema.');
  process.exit(0);
};

runReset().catch((err) => {
  console.error('❌ Reset failed');
  console.error(err);
  process.exit(1);
}); 