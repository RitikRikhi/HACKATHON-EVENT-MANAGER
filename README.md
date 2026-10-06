# Event OS — Microservices Backend & Event Operating System

[![Event OS CI](https://github.com/RitikRikhi/HACKATHON-EVENT-MANAGER/actions/workflows/ci.yml/badge.svg)](https://github.com/RitikRikhi/HACKATHON-EVENT-MANAGER/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript: 5.7](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js: 20+ / 22+](https://img.shields.io/badge/Node.js-v20%2B%20%7C%20v22%2B-green.svg)](https://nodejs.org/)

**Event OS** is a production-grade, highly scalable microservices operating system engineered to power the complete lifecycle of complex real-world events — including hackathons, coding competitions, college fests, multi-track tech conferences, and workshops.

Architected as an **npm workspaces monorepo** with 8 decoupled microservices, 2 shared packages, Supabase PostgreSQL database integration, HMAC-SHA256 signed QR check-in cryptography, algorithmic seat allocation, judging rubrics, community Q&A and chat, and automated GDPR data retention lifecycles.

---

## 📑 Table of Contents

1. [Project Overview & Problem Solved](#-project-overview--problem-solved)
2. [Feature Matrix (Implemented vs Configuration Required)](#-feature-matrix)
3. [Architecture Overview](#-architecture-overview)
4. [Monorepo Directory Structure](#-monorepo-directory-structure)
5. [Quickstart & Local Setup](#-quickstart--local-setup)
6. [Running with Docker Compose](#-running-with-docker-compose)
7. [Comprehensive Documentation Index](#-comprehensive-documentation-index)
8. [API Quick Reference](#-api-quick-reference)
9. [Testing & Quality Verification](#-testing--quality-verification)
10. [CI/CD & Production Quality Gates](#-cicd--production-quality-gates)
11. [License](#-license)

---

## 🎯 Project Overview & Problem Solved

### What Problem Does Event OS Solve?
Generic event management platforms (like Eventbrite, Luma, or basic CRUD templates) only manage simple ticketing and RSVP lists. Real-world engineering hackathons, design jams, and academic competitions require complex operational orchestrations:
- Multi-member team formation with codes, invite links, and leader approvals.
- Offline-resilient gate check-in and multi-checkpoint meal/swag tracking with duplicate protection.
- Track-aware room and seat allocation algorithms (`TRACK_LARGEST_FIRST`).
- Looking-for-Team (LFT) solo matchmaking pools.
- Context-aware support helpdesk tickets that automatically resolve the participant's physical table and team.
- Live stage Q&A with upvoting, interactive polls, and priority announcements.
- GitHub submission locking, multi-criteria judging scorecards, staged results, and formal dispute remarks.
- Automated data retention countdowns with cryptographic deletion receipts.

Event OS integrates all these mission-critical operational systems into an ultra-reliable, decoupled microservices architecture.

### Supported Event Types:
- 💻 **Hackathons & Datathons** (Team formation, GitHub submissions, multi-criteria judging, mentor desk)
- 🏆 **Competitions & Contests** (Leaderboards, staged results, dispute remarks)
- 🎪 **College & Tech Fests** (Multi-track rooms, meal scanning, stage projector screens)
- 🎤 **Conferences & Summits** (Keynotes, live stage Q&A with upvotes, interactive polls)
- 🛠️ **Workshops & Bootcamps** (Capacity enforcement, attendance roster caching)

---

## ✨ Feature Matrix

| Feature | Status | Description |
| :--- | :---: | :--- |
| **JWT Authentication & RBAC** | ✅ Implemented | 5-tier role hierarchy (`SUPER_ADMIN`, `ADMIN`, `TEAM_LEAD`, `PARTICIPANT`, `USER`) with bcrypt salt hashing. |
| **Event Lifecycle Management** | ✅ Implemented | Staged statuses (`DRAFT`, `PUBLISHED`, `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`), join codes, and capacity limits. |
| **Participant Registration & Profile**| ✅ Implemented | College, skills tagging, GitHub/LinkedIn links, and consent timestamps. |
| **Looking-For-Team (LFT) Pool** | ✅ Implemented | Solo attendee discovery directory with search and direct recruitment. |
| **Team Management & Roles** | ✅ Implemented | Auto-generated team codes, member management, and leadership transfer. |
| **Team Invitations & Approvals** | ✅ Implemented | Tokenized invite links with usage quotas and leader approval workflows. |
| **Team Networking & Safety** | ✅ Implemented | Cross-team connection requests, connected profiles, and team safety reporting/blocking. |
| **HMAC-SHA256 QR Check-in** | ✅ Implemented | Cryptographically signed QR codes for gate check-in with replay prevention. |
| **Multi-Checkpoint Scanning** | ✅ Implemented | Checkpoint logs for `CHECKIN`, `LUNCH`, `DINNER`, and `SWAG` with idempotency deduplication. |
| **Offline Check-in & Batch Sync** | ✅ Implemented | Roster cache downloads (`GET /api/checkin/roster/:id`) and batch offline sync (`POST /api/checkin/sync`). |
| **Algorithmic Seat Allocation** | ✅ Implemented | `TRACK_LARGEST_FIRST` and `SEQUENTIAL` seat packing, manual overrides, and bilateral seat swaps. |
| **Priority Announcements & Pinning** | ✅ Implemented | Broadcasts with priorities (`LOW`, `NORMAL`, `HIGH`, `URGENT`, `CRITICAL`) and pinning. |
| **Projector / Stage Screen Display** | ✅ Implemented | Stage dashboard endpoint (`GET /api/events/:id/screen`) for auditorium live countdowns and stats. |
| **Community Channel Chat** | ✅ Implemented | Channels (`general`, `help`, etc.) with in-memory rate limiting and organizer participant muting. |
| **Live Stage Q&A with Upvoting** | ✅ Implemented | Attendee question submission, community upvote counting, and speaker answering. |
| **Interactive Polls** | ✅ Implemented | Multiple-choice poll creation, real-time vote recording, and closing. |
| **Location-Aware Helpdesk** | ✅ Implemented | Support ticketing with auto-enrichment of participant's team, room name, and assigned seat. |
| **Safety / Harassment Routing** | ✅ Implemented | Dedicated `SAFETY` and `HARASSMENT` ticket categorization restricted to Super Admins. |
| **Submissions & File Uploads** | ✅ Implemented | Git repository URL validation, demo links, 30MB asset uploads, and final edit locking. |
| **Multi-Criteria Judging & Scores**| ✅ Implemented | Rubric-based judge scoring with automated aggregate total calculations. |
| **Staged Results Publishing** | ✅ Implemented | 3-stage release pipeline (`DRAFT` -> `REVIEW` -> `PUBLISHED`) with leaderboard payloads. |
| **Remarks & Dispute System** | ✅ Implemented | Formal post-results dispute submission and organizer resolution notes. |
| **Sponsor Metrics & Analytics** | ✅ Implemented | Privacy-preserving aggregate sponsor analytics without exposing participant PII. |
| **Automated Data Retention Purge** | ✅ Implemented | Automated event retention countdown and cleanup with cryptographic deletion receipts. |
| **In-App Notification Center** | ✅ Implemented | Ingests alerts from upstream services, unread counts, and read state tracking. |
| **Transactional Email Alerts** | ⚠️ Config Req | Welcome & login emails via Nodemailer (Requires SMTP credentials in `.env`). |
| **Supabase Realtime WebSockets** | ⚠️ Config Req | Instant table broadcast triggers (Requires enabling Realtime in Supabase UI). |

---

## 🏛️ Architecture Overview

```mermaid
flowchart TD
    Client["Client Applications\n(Web, Mobile PWA, Projector Dashboard)"] -->|HTTP / JSON (Port 8000)| Gateway["API Gateway Service\n(Port 8000)"]

    Gateway -->|/api/auth/*| Auth["Auth Service\n(Port 8001)"]
    Gateway -->|/api/events/*\n/api/submissions/*\n/api/results/*\n/api/remarks/*\n/api/uploads/*| Event["Event Service\n(Port 8002)"]
    Gateway -->|/api/teams/*| Team["Team Service\n(Port 8003)"]
    Gateway -->|/api/tickets/*\n/api/helpdesk/*| Ticket["Ticket & Helpdesk Service\n(Port 8004)"]
    Gateway -->|/api/checkin/*| Checkin["Check-in Service\n(Port 8005)"]
    Gateway -->|/api/announcements/*\n/api/chat/*\n/api/questions/*\n/api/polls/*| Announcement["Announcement & Community Service\n(Port 8006)"]
    Gateway -->|/api/notifications/*| Notification["Notification Service\n(Port 8007)"]

    Auth --> Supabase[("Supabase Database\n(PostgreSQL)")]
    Event --> Supabase
    Team --> Supabase
    Ticket --> Supabase
    Checkin --> Supabase
    Announcement --> Supabase
    Notification --> Supabase

    Auth -.->|SMTP Email Alerts| MailServer["Nodemailer SMTP Gateway"]
```

---

## 📂 Monorepo Directory Structure

```text
event-os/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                     # Continuous Integration pipeline
│   │   ├── test.yml                   # Dedicated unit test workflow
│   │   └── deploy.yml                 # Continuous Deployment quality gate
│   ├── ISSUE_TEMPLATE/                # Bug report & feature request templates
│   └── pull_request_template.md       # Pull request verification checklist
│
├── services/
│   ├── api-gateway/                   # Port 8000: Reverse proxy & auth context forwarding
│   ├── auth-service/                  # Port 8001: Auth, JWT, user roles & SMTP email
│   ├── event-service/                 # Port 8002: Events, seats, submissions, judging & retention
│   ├── team-service/                  # Port 8003: Teams, join codes, invites & networking
│   ├── ticket-service/                # Port 8004: Ticket issuance & location-aware helpdesk
│   ├── checkin-service/               # Port 8005: HMAC QR check-in & offline batch sync
│   ├── announcement-service/          # Port 8006: Priority broadcasts, chat, Q&A & polls
│   └── notification-service/          # Port 8007: In-app notification center
│
├── packages/
│   ├── types/                         # Shared TypeScript interfaces, DTOs & enums
│   └── config/                        # JWT, QR crypto, Supabase client & middlewares
│
├── docs/
│   ├── architecture/                  # System & service responsibility documentation
│   ├── api/                           # Master API index, error mapping & OpenAPI spec
│   ├── frontend/                      # Frontend engineer guide & 15-question quickstart
│   ├── workflows/                     # 16 in-depth sequence & lifecycle guides
│   ├── database/                      # Schema reference, ER diagrams & migration guide
│   ├── security/                      # RBAC, HMAC QR cryptography & privacy rules
│   ├── deployment/                    # Docker Compose & cloud server guides
│   ├── development/                   # Onboarding setup & git branch conventions
│   └── testing/                       # Test suites & execution guide
│
├── postman/
│   ├── Event_OS_API.postman_collection.json    # Complete automated Postman collection
│   └── Event_OS_Local.postman_environment.json # Postman environment variables
│
├── scripts/                           # Database migration runners & test suites
├── docker-compose.yml                 # 8-service Docker Compose orchestration
├── package.json                       # Monorepo workspaces configuration
├── tsconfig.json                      # Monorepo root TypeScript configuration
├── eslint.config.mjs                  # Flat ESLint 9 configuration
├── .env.example                       # Documented environment variables template
├── CHANGELOG.md                       # Release notes & version milestones
└── LICENSE                            # MIT License
```

---

## ⚡ Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and provide your Supabase credentials:
```bash
cp .env.example .env
```

### 3. Build Shared Packages & Services
```bash
npm run build
```

### 4. Apply Database Migrations
```bash
npx tsx scripts/migrate-complete-event-os.ts
```

### 5. Start All 8 Microservices Concurrently
```bash
npm run dev
```

### 6. Verify System Health
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/system/status
```

---

## 🐳 Running with Docker Compose

To build and run all 8 microservices simultaneously in isolated Docker containers:

```bash
# Build and launch containers in background
docker-compose up --build -d

# View live aggregate logs
docker-compose logs -f

# Shutdown and remove containers
docker-compose down
```

---

## 📚 Comprehensive Documentation Index

- **Architecture:**
  - [System Architecture Overview](./docs/architecture/overview.md)
  - [Microservice Responsibilities & Boundaries](./docs/architecture/services.md)
- **API Reference:**
  - [Master API Index](./docs/api/api-index.md)
  - [Standard Error Handling & Status Codes](./docs/api/errors.md)
  - [OpenAPI 3.0 Specification](./docs/api/openapi.json)
- **Frontend Integration:**
  - [Frontend Engineer Complete Guide](./docs/frontend/README.md)
  - [Frontend Quickstart (15 Core Questions)](./docs/frontend/quickstart.md)
- **Workflows:**
  - [Participant Registration](./docs/workflows/registration.md)
  - [Team Management](./docs/workflows/team-management.md)
  - [Team Invitations & Approvals](./docs/workflows/team-invitation.md)
  - [Looking For Team (LFT) Pool](./docs/workflows/looking-for-team.md)
  - [HMAC QR Check-in](./docs/workflows/qr-checkin.md)
  - [Offline Check-in & Batch Sync](./docs/workflows/offline-checkin.md)
  - [Rooms & Seat Allocation](./docs/workflows/seat-allocation.md)
  - [Broadcast Announcements](./docs/workflows/announcements.md)
  - [Community Chat, Q&A & Polls](./docs/workflows/community-chat.md)
  - [Location-Aware Helpdesk](./docs/workflows/help-desk.md)
  - [Team Connections & Safety](./docs/workflows/team-connections.md)
  - [Project Submissions & Uploads](./docs/workflows/submission.md)
  - [Judging & Rubric Scoring](./docs/workflows/judging.md)
  - [Results & Leaderboard Publishing](./docs/workflows/results.md)
  - [Remarks & Dispute System](./docs/workflows/remarks.md)
  - [Data Retention & Deletion Receipts](./docs/workflows/export-delete.md)
- **Database & Security:**
  - [Database Schema & ER Diagram](./docs/database/schema.md)
  - [Database Migrations Guide](./docs/database/migrations.md)
  - [Security, RBAC & Privacy](./docs/security/security.md)
- **Deployment & Development:**
  - [Production Deployment Guide](./docs/deployment/deployment.md)
  - [Local Development Setup](./docs/development/setup.md)
  - [Git Workflow & PR Guidelines](./docs/development/git-workflow.md)
  - [Testing & Verification Guide](./docs/testing/testing.md)

---

## 🧪 Testing & Quality Verification

```bash
# 1. Typecheck entire monorepo
npm run typecheck

# 2. Run ESLint code quality checks
npm run lint

# 3. Run In-Memory Unit Test Suite (Zero Network Dependency)
npm run test:unit

# 4. Run Complete Test Suite
npm test

# 5. Run Live End-to-End Test Runner (against active services)
npm run test:e2e
```

---

## 🚀 CI/CD & Production Quality Gates

Every pull request and push to `main` executes the automated CI pipeline:
1. **Dependency Installation:** `npm ci` with caching.
2. **TypeScript Compilation:** Strict `tsc --noEmit` validation across all 8 services and 2 shared packages.
3. **ESLint Static Analysis:** Code quality and formatting linting.
4. **Cryptographic Unit Tests:** In-memory verification of HMAC signatures, JWT issuance, and domain enum mappings.
5. **Monorepo Build:** Clean production compilation of `@event-os/types`, `@event-os/config`, and all 8 microservices.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
