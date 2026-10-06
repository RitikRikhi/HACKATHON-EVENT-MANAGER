# 🛠️ Service Responsibility Documentation — Event OS

This document outlines the operational contract, port allocation, boundaries, database tables, and communication rules for all services in Event OS.

---

## 1. API Gateway

- **Purpose:** Centralized entry point, reverse proxying, CORS policy management, security header enforcement, and context propagation.
- **Port:** `8000` (`PORT_GATEWAY`)
- **Responsibilities:**
  - Forward client requests to downstream microservices using `http-proxy-middleware`.
  - Extract and decode JWT bearer tokens from `Authorization` header without database overhead.
  - Forward user context headers (`x-user-id`, `x-user-email`, `x-user-role`, `Authorization`) to downstream services.
  - Expose aggregate system health check (`GET /api/system/status`) and gateway liveness (`GET /health`).
- **Does NOT:**
  - Directly query or mutate database tables.
  - Generate JWT tokens or hash user passwords.
  - Execute business logic.
- **Routes Managed:** `/api/auth`, `/api/events`, `/api/teams`, `/api/tickets`, `/api/helpdesk`, `/api/checkin`, `/api/announcements`, `/api/chat`, `/api/questions`, `/api/polls`, `/api/submissions`, `/api/results`, `/api/remarks`, `/api/uploads`, `/api/notifications`.
- **Dependencies:** None (routes purely over HTTP to downstream services).
- **Health Check:** `GET /health`

---

## 2. Auth Service

- **Purpose:** User registration, credential authentication, JWT token issuance, profile maintenance, role management, and transactional email alerts.
- **Port:** `8001` (`PORT_AUTH`)
- **Responsibilities:**
  - Create user accounts with bcrypt salt hashing.
  - Authenticate user credentials and return signed JWTs with claims (`userId`, `email`, `role`).
  - Retrieve current user profile (`GET /api/auth/me`) and update non-privileged profile data (`PUT /api/auth/profile`).
  - Change user passwords (`PUT /api/auth/change-password`).
  - Paginated user list for administrators (`GET /api/auth/users`).
  - Role mutation by Super Admins (`PATCH /api/auth/users/:id/role`).
  - Send welcome emails and login alert emails via Nodemailer SMTP.
- **Does NOT:**
  - Manage event capacity or registrations.
  - Manage teams or tickets.
- **Database Tables Owned:** `users`.
- **External Dependencies:** SMTP Server (e.g. Gmail, Mailtrap, SendGrid).
- **Health Check:** `GET /health`

---

## 3. Event Service

- **Purpose:** Handles event creation, lifecycle stages, participant registration, tracks, rooms, seat allocation algorithms, project submissions, judging scorecards, results publishing, remarks, sponsor tracking, data retention schedules, and export generation.
- **Port:** `8002` (`PORT_EVENT`)
- **Responsibilities:**
  - Create and manage events (`DRAFT`, `PUBLISHED`, `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`).
  - Handle participant registrations with validation of capacity limits and registration deadlines.
  - Manage Looking-for-Team participant discovery pool.
  - Manage event tracks and rooms.
  - Algorithmic seat allocation (`TRACK_LARGEST_FIRST`, `SEQUENTIAL`), manual seat assignment, and team seat swapping.
  - Project submissions (`POST /api/submissions`) with URL validation and locking.
  - Multi-criteria judging scorecards (`POST /api/results/scores`).
  - Staged results publishing (`POST /api/results/publish`).
  - Remarks / post-result dispute submissions (`POST /api/remarks`).
  - Sponsor banner tracking and aggregate metrics.
  - Automated retention cleanup and cryptographically verifiable deletion receipts.
- **Does NOT:**
  - Issue auth JWTs or manage passwords.
  - Generate ticket QR payloads (delegated to Ticket Service / shared config).
- **Database Tables Owned:** `events`, `event_members`, `event_registrations`, `tracks`, `rooms`, `seats`, `submissions`, `scores`, `results`, `remarks`, `sponsors`, `sponsor_events`, `uploads`, `deletion_receipts`, `audit_logs`.
- **Internal Communication:** Dispatches HTTP alerts to `notification-service`.
- **Health Check:** `GET /health`

---

## 4. Team Service

- **Purpose:** Team formation, member role assignments, invite links, join codes, join request approvals, leadership transfers, and cross-team networking connections.
- **Port:** `8003` (`PORT_TEAM`)
- **Responsibilities:**
  - Create teams with unique short codes (`POST /api/teams`).
  - Join teams via join code (`POST /api/teams/join`).
  - Generate shareable invite links with configurable expiry and usage quotas (`POST /api/teams/:id/invite-link`).
  - Team Lead approval / rejection of join requests (`POST /api/teams/:id/join-requests/:requestId/accept`).
  - Remove members and leave teams.
  - Transfer team leadership to designated members (`POST /api/teams/:id/transfer-leadership`).
  - Cross-team networking connection requests (`POST /api/teams/:id/connections`) and safety block/report actions (`POST /api/teams/:id/block`).
- **Does NOT:**
  - Allocate venue seats (handled by Event Service).
  - Check in participants at venue gates (handled by Checkin Service).
- **Database Tables Owned:** `teams`, `team_members`, `team_join_requests`, `team_invite_links`, `team_connections`, `team_blocks`.
- **Internal Communication:** Dispatches HTTP alerts to `notification-service`.
- **Health Check:** `GET /health`

---

## 5. Ticket & Helpdesk Service

- **Purpose:** Ticket booking, QR metadata attachment, status updates, and participant support helpdesk ticketing with automatic seat/room location enrichment.
- **Port:** `8004` (`PORT_TICKET`)
- **Responsibilities:**
  - Create and book tickets with unique codes (`TKT-...`).
  - Validate ticket eligibility (`POST /api/tickets/:id/validate`).
  - Create support helpdesk tickets across categories: `MENTOR`, `TECHNICAL`, `FOOD`, `FACILITIES`, `WIFI`, `SAFETY`, `HARASSMENT`.
  - Automatically query user's team, room, and assigned seat label to enrich helpdesk tickets for organizer triage.
  - Assign support tickets to organizers/mentors and update status to `RESOLVED`.
- **Does NOT:**
  - Scan physical gate entries (handled by Checkin Service).
  - Allocate rooms and seats (handled by Event Service).
- **Database Tables Owned:** `tickets`, `helpdesk_tickets`.
- **Internal Communication:** Queries `event-service` for seat details; dispatches alerts to `notification-service`.
- **Health Check:** `GET /health`

---

## 6. Check-in Service

- **Purpose:** Venue gate check-in, multi-checkpoint attendance tracking (`CHECKIN`, `LUNCH`, `DINNER`, `SWAG`), offline roster cache generation, batch offline scan synchronization, and attendance statistics.
- **Port:** `8005` (`PORT_CHECKIN`)
- **Responsibilities:**
  - Verify HMAC-SHA256 signed QR codes in real-time (`POST /api/checkin/scan`).
  - Prevent duplicate scans per scan type (`CHECKIN`, `LUNCH`, `DINNER`, `SWAG`) using unique constraints and idempotency keys.
  - Serve cached offline participant roster with public verification keys (`GET /api/checkin/roster/:eventId`).
  - Synchronize offline scans uploaded in batches (`POST /api/checkin/sync`).
  - Process printed roster paper check-in reconciliation (`POST /api/checkin/reconcile-printed`).
  - Provide live attendee counts and metrics (`GET /api/checkin/stats/:eventId`).
- **Does NOT:**
  - Generate tickets (handled by Ticket Service).
  - Modify event details or capacities (handled by Event Service).
- **Database Tables Owned:** `checkins`, `scan_logs`.
- **Internal Communication:** Updates ticket status in `ticket-service`; dispatches alerts to `notification-service`.
- **Health Check:** `GET /health`

---

## 7. Announcement & Community Service

- **Purpose:** Official event broadcasts, channel chat with moderation muting, live stage Q&A questions with upvoting, and interactive polls.
- **Port:** `8006` (`PORT_ANNOUNCEMENT`)
- **Responsibilities:**
  - Broadcast official announcements with priority levels (`LOW`, `NORMAL`, `HIGH`, `URGENT`, `CRITICAL`) and pinning.
  - Channel-based community chat (`POST /api/chat/messages`, `GET /api/chat/messages`).
  - Moderation muting of disruptive participants (`POST /api/chat/mute`).
  - Live stage Q&A questions with community upvote tallies (`POST /api/questions`, `POST /api/questions/:id/upvote`) and organizer answers (`POST /api/questions/:id/answer`).
  - Interactive polls creation, vote recording, and closing (`POST /api/polls`, `POST /api/polls/:id/vote`).
- **Does NOT:**
  - Dispatch in-app notifications (delegated to Notification Service).
- **Database Tables Owned:** `announcements`, `chat_messages`, `chat_mutes`, `questions`, `question_upvotes`, `polls`, `poll_options`, `poll_votes`.
- **Internal Communication:** Dispatches broadcast notices to `notification-service`.
- **Health Check:** `GET /health`

---

## 8. Notification Service

- **Purpose:** In-app notification center, unread counters, and targeted/broadcast alerts.
- **Port:** `8007` (`PORT_NOTIFICATION`)
- **Responsibilities:**
  - Ingest notification payloads dispatched by upstream microservices (`POST /api/notifications`, `POST /api/notifications/broadcast`).
  - Retrieve participant's in-app notification inbox (`GET /api/notifications`).
  - Retrieve unread notification counts (`GET /api/notifications/unread-count`).
  - Mark single notification or all notifications as read (`PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`).
- **Does NOT:**
  - Send SMTP emails directly (handled by Auth Service).
- **Database Tables Owned:** `notifications`.
- **Health Check:** `GET /health`
