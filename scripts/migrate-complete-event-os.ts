import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL...');

  // 1. Extensions
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  // 2. Events table updates
  await client.query(`
    ALTER TABLE events ADD COLUMN IF NOT EXISTS join_code VARCHAR(50) UNIQUE;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS retention_days INT DEFAULT 30;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_events_join_code ON events(join_code);');

  // 3. Event Members table (roles per event)
  await client.query(`
    CREATE TABLE IF NOT EXISTS event_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'ORGANIZER', 'SUPER_ADMIN', 'VOLUNTEER', 'MENTOR', 'JUDGE', 'STAFF')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_event_user_role UNIQUE (event_id, user_id, role)
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_event_members_event ON event_members(event_id);');
  await client.query('CREATE INDEX IF NOT EXISTS idx_event_members_user ON event_members(user_id);');

  // 4. Participants / Event Registrations enhancement
  await client.query(`
    ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS college VARCHAR(255);
    ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS skills TEXT[];
    ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;
    ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
    ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS looking_for_team BOOLEAN DEFAULT FALSE;
    ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS qr_payload TEXT;
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_event_reg_looking_for_team ON event_registrations(event_id, looking_for_team);');

  // 5. Tracks
  await client.query(`
    CREATE TABLE IF NOT EXISTS tracks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_tracks_event ON tracks(event_id);');

  // 6. Rooms
  await client.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      capacity INT NOT NULL DEFAULT 100 CHECK (capacity >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_rooms_event ON rooms(event_id);');

  // 7. Seats
  await client.query(`
    CREATE TABLE IF NOT EXISTS seats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      label VARCHAR(50) NOT NULL,
      team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_room_seat_label UNIQUE (room_id, label)
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_seats_event ON seats(event_id);');
  await client.query('CREATE INDEX IF NOT EXISTS idx_seats_room ON seats(room_id);');
  await client.query('CREATE INDEX IF NOT EXISTS idx_seats_team ON seats(team_id);');

  // 8. Update Teams table with track_id, room_id, seat_label
  await client.query(`
    ALTER TABLE teams ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES tracks(id) ON DELETE SET NULL;
    ALTER TABLE teams ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;
    ALTER TABLE teams ADD COLUMN IF NOT EXISTS seat_label VARCHAR(100);
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_teams_track ON teams(track_id);');
  await client.query('CREATE INDEX IF NOT EXISTS idx_teams_room ON teams(room_id);');

  // 9. Announcements update (priority CRITICAL, pinned)
  await client.query(`
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;
    ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_priority_check;
    ALTER TABLE announcements ADD CONSTRAINT announcements_priority_check CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'));
  `);

  // 10. Chat Messages & Moderation
  await client.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      channel VARCHAR(100) NOT NULL DEFAULT 'general',
      participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_chat_event_channel ON chat_messages(event_id, channel, created_at DESC);');
  await client.query('CREATE INDEX IF NOT EXISTS idx_chat_participant ON chat_messages(participant_id);');

  await client.query(`
    CREATE TABLE IF NOT EXISTS chat_mutes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      muted_until TIMESTAMPTZ,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_event_user_mute UNIQUE (event_id, user_id)
    );
  `);

  // 11. Questions & Upvotes (Q&A)
  await client.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      answered BOOLEAN NOT NULL DEFAULT FALSE,
      answer TEXT,
      answered_by UUID REFERENCES users(id) ON DELETE SET NULL,
      upvotes INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_questions_event ON questions(event_id, created_at DESC);');

  await client.query(`
    CREATE TABLE IF NOT EXISTS question_upvotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_question_user_upvote UNIQUE (question_id, user_id)
    );
  `);

  // 12. Polls, Poll Options & Votes
  await client.query(`
    CREATE TABLE IF NOT EXISTS polls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_polls_event ON polls(event_id);');

  await client.query(`
    CREATE TABLE IF NOT EXISTS poll_options (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      option_text VARCHAR(255) NOT NULL,
      vote_count INT NOT NULL DEFAULT 0
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);');

  await client.query(`
    CREATE TABLE IF NOT EXISTS poll_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_poll_user_vote UNIQUE (poll_id, user_id)
    );
  `);

  // 13. Helpdesk / Support Tickets
  await client.query(`
    CREATE TABLE IF NOT EXISTS helpdesk_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
      category VARCHAR(50) NOT NULL CHECK (category IN ('MENTOR', 'TECHNICAL', 'FOOD', 'FACILITIES', 'WIFI', 'SAFETY', 'HARASSMENT')),
      description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ASSIGNED', 'RESOLVED', 'CANCELLED')),
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      assigned_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ,
      resolved_notes TEXT
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_helpdesk_event ON helpdesk_tickets(event_id, status);');
  await client.query('CREATE INDEX IF NOT EXISTS idx_helpdesk_category ON helpdesk_tickets(category);');

  // 14. Team Connections & Block/Report
  await client.query(`
    CREATE TABLE IF NOT EXISTS team_connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      from_team UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      to_team UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_team_connection UNIQUE (from_team, to_team)
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_connections_event ON team_connections(event_id);');

  await client.query(`
    CREATE TABLE IF NOT EXISTS team_blocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      blocker_team UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      blocked_team UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_team_block UNIQUE (blocker_team, blocked_team)
    );
  `);

  // 15. Submissions
  await client.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      repo_url TEXT NOT NULL,
      demo_url TEXT,
      description TEXT,
      file_url TEXT,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_locked BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_event_team_submission UNIQUE (event_id, team_id)
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_submissions_event ON submissions(event_id);');

  // 16. Scores (Judging)
  await client.query(`
    CREATE TABLE IF NOT EXISTS scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      judge_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
      total NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
      feedback TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_score_judge_team UNIQUE (event_id, team_id, judge_id)
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_scores_event ON scores(event_id);');
  await client.query('CREATE INDEX IF NOT EXISTS idx_scores_team ON scores(team_id);');

  // 17. Results
  await client.query(`
    CREATE TABLE IF NOT EXISTS results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE UNIQUE,
      status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED')),
      published_at TIMESTAMPTZ,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_results_event ON results(event_id);');

  // 18. Remarks
  await client.query(`
    CREATE TABLE IF NOT EXISTS remarks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'RESOLVED')),
      resolution_notes TEXT,
      reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_remarks_event ON remarks(event_id);');

  // 19. Sponsors & Sponsor Events
  await client.query(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      banner_url TEXT,
      link TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_sponsors_event ON sponsors(event_id);');

  await client.query(`
    CREATE TABLE IF NOT EXISTS sponsor_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 20. Scan Logs (CHECKIN, LUNCH, DINNER, SWAG)
  await client.query(`
    CREATE TABLE IF NOT EXISTS scan_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('CHECKIN', 'LUNCH', 'DINNER', 'SWAG')),
      scanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
      scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      idempotency_key VARCHAR(255) UNIQUE,
      CONSTRAINT unique_participant_scan_type UNIQUE (event_id, participant_id, type)
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_scan_logs_event ON scan_logs(event_id);');
  await client.query('CREATE INDEX IF NOT EXISTS idx_scan_logs_participant ON scan_logs(participant_id);');

  // 21. Audit Logs
  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_id, created_at DESC);');

  // 22. Deletion Receipts
  await client.query(`
    CREATE TABLE IF NOT EXISTS deletion_receipts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      records_deleted INT DEFAULT 0,
      storage_files_deleted INT DEFAULT 0,
      receipt_token VARCHAR(255) NOT NULL UNIQUE
    );
  `);

  // 23. Uploads
  await client.query(`
    CREATE TABLE IF NOT EXISTS uploads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size BIGINT NOT NULL,
      category VARCHAR(50) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_uploads_event ON uploads(event_id);');

  console.log('✅ ALL Event OS tables, indexes, constraints, and relations created successfully!');
  await client.end();
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
