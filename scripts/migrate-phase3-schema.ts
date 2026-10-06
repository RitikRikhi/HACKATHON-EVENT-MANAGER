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

  // 1. Inspect existing teams and team_members columns
  const teamsCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'teams';
  `);
  console.log('Existing teams columns:', teamsCols.rows);

  const membersCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'team_members';
  `);
  console.log('Existing team_members columns:', membersCols.rows);

  // 2. Add missing columns to teams table if not present
  await client.query(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_code VARCHAR(50) UNIQUE;`);
  await client.query(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(team_code);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);`);

  // 3. Update / Ensure team_members columns and constraints
  await client.query(`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);`);

  // 4. Create team_join_requests table
  await client.query(`
    CREATE TABLE IF NOT EXISTS team_join_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL DEFAULT 'CODE' CHECK (type IN ('CODE', 'LINK')),
      invitation_token VARCHAR(255),
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED')),
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_team_join_requests_team ON team_join_requests(team_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_team_join_requests_user ON team_join_requests(user_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON team_join_requests(status);`);

  // 5. Create team_invite_links table
  await client.query(`
    CREATE TABLE IF NOT EXISTS team_invite_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      max_uses INT DEFAULT NULL,
      used_count INT DEFAULT 0,
      expires_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_team_invite_links_token ON team_invite_links(token);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_team_invite_links_team ON team_invite_links(team_id);`);

  console.log('✅ Phase 3 Team Service schema migrated successfully!');
  await client.end();
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
