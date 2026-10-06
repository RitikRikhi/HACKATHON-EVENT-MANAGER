# 🏛️ Architecture Overview — Event OS

Event OS is a production-grade microservices backend designed to manage the entire lifecycle of real-world events such as hackathons, coding competitions, conferences, college fests, and workshops.

---

## 🏗️ System Architecture Diagram

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

    Auth -->|PostgreSQL DDL / Client| Supabase[("Supabase Database\n(PostgreSQL)")]
    Event -->|PostgreSQL DDL / Client| Supabase
    Team -->|PostgreSQL DDL / Client| Supabase
    Ticket -->|PostgreSQL DDL / Client| Supabase
    Checkin -->|PostgreSQL DDL / Client| Supabase
    Announcement -->|PostgreSQL DDL / Client| Supabase
    Notification -->|PostgreSQL DDL / Client| Supabase

    Auth -.->|SMTP Email Alerts| MailServer["Nodemailer SMTP Gateway"]
    Event -.->|Inter-Service HTTP Event Alerts| Notification
    Team -.->|Inter-Service HTTP Team Alerts| Notification
    Checkin -.->|Inter-Service HTTP Checkin Alerts| Notification
    Announcement -.->|Inter-Service Broadcasts| Notification
```

---

## 🌐 API Gateway Role
The **API Gateway (Port 8000)** is the sole public-facing service.
1. **Reverse Proxying**: Routes requests to specific microservice ports without exposing internal port layouts to the client.
2. **Contextual Header Enrichment**:
   - Inspects `Authorization: Bearer <JWT>`.
   - Decodes claims without database lookup and populates downstream headers: `x-user-id`, `x-user-email`, `x-user-role`.
   - Propagates existing `Authorization` header to allow microservices to execute localized verification.
3. **Security Perimeter**: Implements Helmet HTTP protection, CORS headers, and 30MB payload boundaries.
4. **Health Aggregation**: Aggregates health across all downstream microservices and the Supabase database at `/api/system/status`.

---

## 🧩 Microservice Responsibilities Summary
| Microservice | Port | Primary Responsibility |
| :--- | :--- | :--- |
| **API Gateway** | `8000` | Unified entry point, auth header forwarding, CORS, and request proxying. |
| **Auth Service** | `8001` | User registration, login, JWT token issuance, profile management, and SMTP emails. |
| **Event Service** | `8002` | Event lifecycle, participant registration, tracks, rooms, seat allocation, submissions, judging, results, remarks, and retention cleanup. |
| **Team Service** | `8003` | Teams, join codes, tokenized invite links, join request approvals, leadership transfer, and team networking connections. |
| **Ticket Service** | `8004` | Ticket generation, gate validation, and support helpdesk ticketing with participant seat/room resolution. |
| **Check-in Service** | `8005` | Multi-scan QR verification (`CHECKIN`, `LUNCH`, `DINNER`, `SWAG`), offline roster cache, and batch offline sync. |
| **Announcement Service** | `8006` | Priority broadcasts, channel chat with moderation muting, live Q&A with upvoting, and polls. |
| **Notification Service** | `8007` | In-app notification center, unread counters, and targeted/broadcast alerts. |

---

## 🗄️ Database Ownership & Access Model
- **PostgreSQL Database**: Hosted on Supabase with relational schemas, foreign key cascade constraints, unique constraints, and B-tree indexes.
- **Client Access**: Microservices interact with Supabase using `@supabase/supabase-js` via `@event-os/config` with the `SUPABASE_SERVICE_ROLE_KEY`, providing guaranteed query isolation and bypassing row-level restrictions on server-side operations while enforcing domain constraints in application logic.
- **Direct PostgreSQL Connection**: Migration and administrative scripts use `DATABASE_URL` via the `pg` client to run DDL operations.

---

## 🔐 Authentication & Request Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    actor Participant as Participant / Client
    participant Gateway as API Gateway (:8000)
    participant Auth as Auth Service (:8001)
    participant Microservice as Target Microservice (e.g. :8002)
    participant DB as Supabase PostgreSQL

    Participant->>Gateway: POST /api/auth/login { email, password }
    Gateway->>Auth: Forward to http://auth-service:8001/login
    Auth->>DB: Query user by email & verify bcrypt password
    DB-->>Auth: User record
    Auth-->>Gateway: 200 OK { token: "JWT...", user: { ... } }
    Gateway-->>Participant: 200 OK with JWT Token

    Note over Participant,Gateway: Subsequent Protected Request
    Participant->>Gateway: POST /api/events/:id/register (Header: Bearer JWT)
    Gateway->>Gateway: Decode JWT & inject headers (x-user-id, x-user-role)
    Gateway->>Microservice: Forward POST /events/:id/register with injected headers
    Microservice->>Microservice: Authenticate & Authorize Role
    Microservice->>DB: Insert event_registrations record
    DB-->>Microservice: Confirmed
    Microservice-->>Gateway: 201 Created { registration }
    Gateway-->>Participant: 201 Created Response
```
