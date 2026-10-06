# 📢 Announcement & Community Service

The **Announcement Service** powers organizer broadcasts, real-time channel chat, live stage Q&A questions with community upvoting, and interactive polls.

---

## 🎯 Key Responsibilities
- Official announcements with priority tiers (`LOW`, `NORMAL`, `HIGH`, `URGENT`, `CRITICAL`) and pinning support.
- Channel-based community chat (`POST /api/chat/messages`, `GET /api/chat/messages`).
- Chat moderation with participant muting (`POST /api/chat/mute`).
- Live Q&A questions (`POST /api/questions`), community upvoting (`POST /api/questions/:id/upvote`), and organizer answers (`POST /api/questions/:id/answer`).
- Polls creation (`POST /api/polls`), live voting (`POST /api/polls/:id/vote`), and poll closure.
- In-memory rate limiting on chat messages and questions to prevent flood abuse.

---

## 🔌 Service Port & Routes
- **Port:** `8006` (Configurable via `PORT_ANNOUNCEMENT`)
- **Gateway Routes:**
  - `/api/announcements/*`
  - `/api/chat/*`
  - `/api/questions/*`
  - `/api/polls/*`

---

## 🗄️ Database Tables Owned
- `announcements`: Broadcast messages with priority and pinning.
- `chat_messages`: Channel messages with soft delete support.
- `chat_mutes`: User chat mute periods.
- `questions`: Q&A submissions and answers.
- `question_upvotes`: Upvote linkages.
- `polls`: Poll questions and state (`OPEN`, `CLOSED`).
- `poll_options`: Candidate voting options with tally.
- `poll_votes`: Participant vote records.

---

## 🩺 Health Check
- `GET /health` -> `{ "success": true, "data": { "status": "healthy", "service": "announcement-service" } }`
