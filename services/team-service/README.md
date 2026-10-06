# 👥 Team Service

The **Team Service** handles all aspects of team formation, member role assignments, invite links, join codes, join request approvals, leadership transfers, and cross-team networking connections.

---

## 🎯 Key Responsibilities
- Team creation with auto-generated unique team code (`POST /api/teams`)
- Team roster retrieval with member profiles and roles (`GET /api/teams/:id`)
- Join requests via team code (`POST /api/teams/join`)
- Tokenized invite link generation with expiration and usage limits (`POST /api/teams/:id/invite-link`)
- Join request review and acceptance/rejection by Team Lead (`POST /api/teams/:id/join-requests/:requestId/accept`)
- Direct member additions, member removals, and leaving team
- Leadership transfer to designated team member (`POST /api/teams/:id/transfer-leadership`)
- Cross-team connection requests, profile visibility, and team blocking/reporting

---

## 🔌 Service Port & Routes
- **Port:** `8003` (Configurable via `PORT_TEAM`)
- **Gateway Route:** `/api/teams/*`

---

## 🗄️ Database Tables Owned
- `teams`: Team records with `id`, `name`, `description`, `event_id`, `team_code`, `status`, `track_id`, `room_id`, `seat_label`, `created_by`.
- `team_members`: Member linkages with `role` (`TEAM_LEAD`, `MEMBER`, `VOLUNTEER`).
- `team_join_requests`: Pending/Accepted/Rejected join requests.
- `team_invite_links`: Shareable invite tokens.
- `team_connections`: Cross-team networking links (`PENDING`, `ACCEPTED`, `REJECTED`, `BLOCKED`).
- `team_blocks`: Safety blocking and reporting between teams.

---

## 🩺 Health Check
- `GET /health` -> `{ "success": true, "data": { "status": "healthy", "service": "team-service" } }`
