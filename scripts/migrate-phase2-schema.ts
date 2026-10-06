import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to PostgreSQL via pg client');

  // 1. Update events table schema
  await client.query('ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT \'OTHER\';');
  await client.query('ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;');
  await client.query('ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;');
  await client.query(`
    ALTER TABLE events
    ADD CONSTRAINT events_status_check
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'));
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);');

  // 2. Create event_registrations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'CANCELLED', 'ATTENDED')),
      registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_event_user_registration UNIQUE (event_id, user_id)
    );
  `);

  await client.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);');
  await client.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);');
  await client.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);');

  console.log('✅ Events and Event Registrations schema updated successfully in Supabase!');
  await client.end();
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
