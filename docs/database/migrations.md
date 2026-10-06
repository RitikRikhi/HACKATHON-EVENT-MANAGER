# 🗄️ Database Migrations Guide — Event OS

This document explains how database schemas are versioned, created, tested, and applied across local and production Supabase PostgreSQL instances.

---

## 🏗️ Migration Architecture

Migrations in Event OS are managed via TypeScript scripts in the `scripts/` directory using the direct PostgreSQL connection (`DATABASE_URL`).

### Key Migration Scripts:
1. `supabase-schema.sql`: Core baseline DDL (Users, Events, Teams, Tickets, Checkins, Announcements, Notifications).
2. `scripts/migrate-user-schema.ts`: Phase 1 user profile and role migrations.
3. `scripts/migrate-phase2-schema.ts`: Phase 2 events, tracks, rooms, seats, registrations, and capacity constraints.
4. `scripts/migrate-phase3-schema.ts`: Phase 3 team short codes, invite links, and join requests.
5. `scripts/migrate-complete-event-os.ts`: Complete comprehensive migration covering submissions, scoring rubrics, results, remarks, chat moderation, Q&A upvotes, polls, sponsors, and deletion receipts.
6. `scripts/migrate-rls-policies.ts`: Supabase Row Level Security (RLS) policies.

---

## 🚀 How to Apply Migrations

### 1. Configure Environment
Ensure your `.env` has a valid `DATABASE_URL`:
```env
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres
```

### 2. Execute Complete Migration
Run the master migration script:
```bash
npx tsx scripts/migrate-complete-event-os.ts
```

### 3. Verify Database Tables
Run the database inspection utility:
```bash
npx tsx scripts/inspect-db.ts
```

---

## 🔒 Safe Production Migration Rules
1. **Never drop columns destructively:** Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
2. **Use idempotent DDL:** Always specify `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
3. **No hardcoded secrets:** Never commit connection strings or passwords into migration files.
