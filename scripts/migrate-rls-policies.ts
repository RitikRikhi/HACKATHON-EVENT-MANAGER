import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function enableRLS() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Enabling Row Level Security (RLS) on all Event OS tables...');

  const tables = [
    'users',
    'events',
    'event_members',
    'event_registrations',
    'tracks',
    'rooms',
    'seats',
    'teams',
    'team_members',
    'team_join_requests',
    'team_invite_links',
    'tickets',
    'checkins',
    'scan_logs',
    'announcements',
    'notifications',
    'chat_messages',
    'chat_mutes',
    'questions',
    'question_upvotes',
    'polls',
    'poll_options',
    'poll_votes',
    'helpdesk_tickets',
    'team_connections',
    'team_blocks',
    'submissions',
    'scores',
    'results',
    'remarks',
    'sponsors',
    'sponsor_events',
    'audit_logs',
    'uploads',
    'deletion_receipts',
  ];

  for (const table of tables) {
    // Enable RLS
    await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);

    // Drop existing service_role policy if exists
    await client.query(`DROP POLICY IF EXISTS "service_role_all_${table}" ON ${table};`);

    // Add service_role policy allowing all access for microservices
    await client.query(`
      CREATE POLICY "service_role_all_${table}" ON ${table}
      FOR ALL
      USING (true)
      WITH CHECK (true);
    `);
    console.log(`✅ RLS enabled and service_role policy configured for table "${table}"`);
  }

  console.log('\n🔒 RLS configuration complete on all tables!');
  await client.end();
}

enableRLS().catch((err) => {
  console.error('RLS migration error:', err);
  process.exit(1);
});
