# 📝 Workflow: Participant Registration

This document outlines the complete participant registration lifecycle from event discovery to consent and ticket allocation.

---

## 🔄 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Participant as Student / Participant
    participant UI as Frontend App
    participant Gateway as API Gateway
    participant EventSvc as Event Service
    participant TicketSvc as Ticket Service
    participant DB as Supabase PostgreSQL

    Participant->>UI: Opens Event Join Link (/events/join/:code)
    UI->>Gateway: GET /api/events/join/:code
    Gateway->>EventSvc: Look up event by code
    EventSvc->>DB: Query events WHERE join_code = :code
    DB-->>EventSvc: Event metadata
    EventSvc-->>UI: 200 OK (Event details, capacity, dates)

    Participant->>UI: Fills Registration Form (College, Skills, Consent)
    UI->>Gateway: POST /api/events/:id/register (Bearer JWT)
    Gateway->>EventSvc: Register participant
    EventSvc->>DB: Check capacity & existing registration
    alt Capacity full or already registered
        EventSvc-->>UI: 409 Conflict / Capacity Exceeded
    else Registration Valid
        EventSvc->>DB: Insert event_registrations
        EventSvc-->>UI: 201 Created (Registration confirmed)
    end

    UI->>Gateway: POST /api/tickets { eventId }
    Gateway->>TicketSvc: Issue event ticket & QR code
    TicketSvc->>DB: Insert tickets record with HMAC QR payload
    TicketSvc-->>UI: 201 Created (Ticket code & QR)
```

---

## 📋 Step-by-Step Execution

### 1. Discover Event
- **Actor:** Participant
- **API Call:** `GET /api/events/join/:code` or `GET /api/events/:id`
- **Data Returned:** Event name, venue, dates, capacity, remaining spots, status.

### 2. Submit Registration
- **Actor:** Participant
- **API Call:** `POST /api/events/:id/register`
- **Headers:** `Authorization: Bearer <JWT>`
- **Request Body:**
  ```json
  {
    "college": "Stanford University",
    "skills": ["React", "Python", "Computer Vision"],
    "socialLinks": { "github": "https://github.com/alice" },
    "consent": true,
    "lookingForTeam": false
  }
  ```
- **Backend Validations:**
  - JWT is valid.
  - Event status is `PUBLISHED` or `UPCOMING`.
  - Registration deadline has not passed.
  - Total registered count < capacity.
  - User is not already registered.

### 3. Automatic Ticket Generation
- **Actor:** Frontend
- **API Call:** `POST /api/tickets`
- **Request Body:** `{ "eventId": "..." }`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "ticket_code": "TKT-A92B-481F",
      "status": "ACTIVE",
      "qr_data": "usr-id|evt-id|1743948000|v1|3f9a72..."
    }
  }
  ```
