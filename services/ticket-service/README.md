# 🎟️ Ticket & Helpdesk Service

The **Ticket Service** is responsible for issuing cryptographically signed event tickets, QR generation, status transitions, and managing participant support helpdesk tickets with contextual participant seat and team resolution.

---

## 🎯 Key Responsibilities
- Ticket booking & generation with unique code (`TKT-...`) and embedded QR metadata.
- Ticket status tracking (`ACTIVE`, `USED`, `CANCELLED`, `EXPIRED`).
- Ticket validation endpoint for gate inspection.
- Helpdesk ticket creation across categories: `MENTOR`, `TECHNICAL`, `FOOD`, `FACILITIES`, `WIFI`, `SAFETY`, `HARASSMENT`.
- Automatic participant location enrichment (resolves user's team, room name, and assigned seat).
- Helpdesk assignment, note tracking, and resolution lifecycle.
- Ticket rate limiting to prevent spam submissions.

---

## 🔌 Service Port & Routes
- **Port:** `8004` (Configurable via `PORT_TICKET`)
- **Gateway Routes:**
  - `/api/tickets/*`
  - `/api/helpdesk/*`

---

## 🗄️ Database Tables Owned
- `tickets`: Ticket records with `ticket_code`, `price`, `status`, `qr_data`.
- `helpdesk_tickets`: Support requests with `category`, `description`, `status`, `assigned_to`, `resolved_notes`.

---

## 🩺 Health Check
- `GET /health` -> `{ "success": true, "data": { "status": "healthy", "service": "ticket-service" } }`
