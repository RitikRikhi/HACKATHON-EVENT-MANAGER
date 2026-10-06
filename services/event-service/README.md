# 📅 Event Service

The **Event Service** is the central orchestrator for the event lifecycle, participant registration, tracks, rooms, seat allocation algorithms, project submissions, judging scorecards, results publishing, remarks, sponsor tracking, data retention schedules, and export generation.

---

## 🎯 Key Responsibilities
- Event creation, lifecycle transitions (`DRAFT`, `PUBLISHED`, `COMPLETED`, `CANCELLED`), capacity limits, and join codes.
- Participant registration, profile details (college, skills, social links), consent timestamps, and looking-for-team pool.
- Event member role delegation (`ADMIN`, `ORGANIZER`, `JUDGE`, `MENTOR`, `VOLUNTEER`, `STAFF`).
- Tracks, rooms, and algorithmic seat allocation (`TRACK_LARGEST_FIRST`, `SEQUENTIAL`), manual seat override, and team seat swapping.
- Submissions management with GitHub repo URL and live demo URL locking.
- Multi-criteria judging scorecards (`scores` table) and aggregate calculation.
- Staged results publishing (`DRAFT` -> `REVIEW` -> `PUBLISHED`).
- Post-results dispute remarks system.
- Sponsor banner tracking and sponsor aggregate event metrics.
- Event data export and automated retention data cleanup with verifiable deletion receipts.

---

## 🔌 Service Port & Routes
- **Port:** `8002` (Configurable via `PORT_EVENT`)
- **Gateway Routes:**
  - `/api/events/*`
  - `/api/submissions/*`
  - `/api/results/*`
  - `/api/remarks/*`
  - `/api/uploads/*`

---

## 🗄️ Database Tables Owned / Managed
- `events`, `event_members`, `event_registrations`, `tracks`, `rooms`, `seats`, `submissions`, `scores`, `results`, `remarks`, `sponsors`, `sponsor_events`, `uploads`, `deletion_receipts`, `audit_logs`.

---

## 🩺 Health Check
- `GET /health` -> `{ "success": true, "data": { "status": "Operational", "service": "event-service" } }`
