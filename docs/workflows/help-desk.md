# 🆘 Workflow: Helpdesk & Support Ticketing

The Helpdesk system allows participants to submit assistance requests with automated location resolution (user's team, room name, and assigned seat) to accelerate mentor and volunteer triage.

---

## 🏷️ Categories & Special Safety Routing

| Category | Typical Inquiries | Routed To |
| :--- | :--- | :--- |
| **`MENTOR`** | Architecture advice, debugging, API help | Technical Mentors |
| **`TECHNICAL`** | Power strips, monitors, HDMI cables | Hardware & IT Staff |
| **`FOOD`** | Dietary requirements, meal vouchers | Logistics Volunteers |
| **`FACILITIES`** | Room temperature, chairs, venue access | Venue Operations |
| **`WIFI`** | Connection drops, captive portal issues | Network Operations |
| **`SAFETY`** | Medical emergency, safety hazard | Lead Organizer & Security |
| **`HARASSMENT`** | Code of conduct violation | Restricted to Super Admins |

---

## 🔄 Automatic Location Enrichment

```mermaid
sequenceDiagram
    autonumber
    actor Participant as Attendee
    participant UI as Frontend App
    participant Gateway as API Gateway
    participant TicketSvc as Ticket Service
    participant EventSvc as Event Service
    participant DB as Supabase PostgreSQL

    Participant->>UI: Submits Ticket { category: "TECHNICAL", description: "Monitor flashing" }
    UI->>Gateway: POST /api/helpdesk
    Gateway->>TicketSvc: Create helpdesk ticket
    TicketSvc->>EventSvc: Query user location (team, room, seat)
    EventSvc-->>TicketSvc: { teamName: "Quantum Coders", room: "Hall B", seat: "Table 12-A" }
    TicketSvc->>DB: Insert helpdesk_tickets with enriched location metadata
    TicketSvc-->>UI: 201 Created (Ticket ID #HD-1094, assigned status: OPEN)
```

---

## 🛠️ API Reference

### 1. Create Ticket
- **Endpoint:** `POST /api/helpdesk`
- **Headers:** `Authorization: Bearer <JWT>`
- **Body:**
  ```json
  {
    "category": "MENTOR",
    "description": "Need help debugging PyTorch CUDA out-of-memory error."
  }
  ```

### 2. Update Ticket Status / Assign
- **Endpoint:** `PATCH /api/helpdesk/:id`
- **Headers:** `Authorization: Bearer <Staff/Mentor_JWT>`
- **Body:**
  ```json
  {
    "status": "ASSIGNED",
    "assignedTo": "mentor-user-uuid",
    "resolvedNotes": "Guided team on batch size reduction."
  }
  ```
