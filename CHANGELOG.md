# Changelog

All notable changes to the Event OS Microservices Backend are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-06

### 🚀 Productionization & System Standardization
- **API Gateway & Routing**: Standardized reverse proxy routing with header forwarding (`x-user-id`, `x-user-email`, `x-user-role`, `Authorization`) across 8 microservices.
- **CI/CD Pipeline**: GitHub Actions workflows for continuous integration (`ci.yml`), automated unit testing (`test.yml`), and container deployment quality gates (`deploy.yml`).
- **Cryptographic Test Suite**: Added standalone zero-dependency unit tests for HMAC QR signing, JWT verification, and domain status code contracts.
- **Developer & Frontend Documentation**: Complete `docs/` tree containing architecture overviews, service catalogs, 16 user workflow guides, database schemas, frontend integration quickstarts, and security guidelines.
- **Postman Collection & Environment**: Comprehensive Postman Collection with automated token extraction and test scripts covering all 19 functional domains.

### 👥 Teams, Invites & Collaboration (Phase 3)
- Implemented team creation, join codes, tokenized invite links, join request approval workflows, leadership transfer, and team disbandment.
- Added Looking-for-Team matchmaking pool for registered participants.
- Added Team Connections and Block/Report mechanisms for safe cross-team interaction.

### 📅 Events, Tracks & Seat Allocation (Phase 2)
- Added event creation, publishing, capacity enforcement, join codes, and event membership role delegation (`ADMIN`, `ORGANIZER`, `JUDGE`, `MENTOR`, `VOLUNTEER`).
- Implemented tracks, rooms, seat allocation algorithms (`TRACK_LARGEST_FIRST`, `SEQUENTIAL`), manual seat overrides, and seat swapping.
- Added Projector / Screen Display API for live stage dashboards.

### 🎟️ Ticketing & QR Check-in (Phase 4 & 5)
- Automated ticket generation with HMAC SHA-256 signed QR payloads.
- Multi-scan attendance tracking (`CHECKIN`, `LUNCH`, `DINNER`, `SWAG`).
- Offline check-in roster caching, batch offline scan synchronization, idempotency key deduplication, and printed roster fallback reconciliation.

### 📢 Announcements, Community Chat & Helpdesk (Phase 6)
- Priority broadcast announcements (`LOW`, `NORMAL`, `HIGH`, `URGENT`, `CRITICAL`) with pinning.
- Channel-based community chat with user muting moderation.
- Live Q&A questions with upvoting and organizer answering.
- Polls with real-time voting counts.
- Helpdesk ticketing with automated participant location resolution (room, seat, team) and dedicated `SAFETY`/`HARASSMENT` routing.

### 🏆 Submissions, Judging, Results & Remarks (Phase 7)
- Multi-file uploads (ZIP, PDF, images) and GitHub repository/demo submission locking.
- Multi-criteria judging scorecards with aggregate calculation.
- Staged results workflow (`DRAFT` -> `REVIEW` -> `PUBLISHED`).
- Post-result participant remarks and dispute resolution.

### 🔒 Security, Retention & Deletion (Phase 8)
- Automated event data retention cleanup scheduler.
- Verifiable deletion receipt generation with cryptographic tokens.
- Role-based access control (RBAC), Row-Level Security (RLS) policies, and in-memory rate limiting for chat, questions, and helpdesk tickets.

---

## [0.1.0] - 2026-10-04

### 📦 Initial Prototype (Phase 1)
- Initial npm monorepo workspaces configuration.
- Auth service with bcrypt password hashing, JWT issuance, and Nodemailer integration.
- Supabase PostgreSQL DDL foundation.
