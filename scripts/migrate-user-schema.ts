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

  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);');
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;');
  await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
  await client.query(`
    ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('USER', 'PARTICIPANT', 'TEAM_LEAD', 'ADMIN', 'SUPER_ADMIN'));
  `);

  console.log('✅ Users table schema updated successfully');
  await client.end();
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
