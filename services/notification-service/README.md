# 🔔 Notification Service

The **Notification Service** provides an in-app notification center, tracking targeted participant alerts and broadcasts dispatched by other microservices.

---

## 🎯 Key Responsibilities
- Internal notification dispatch endpoint (`POST /api/notifications`) used by other microservices.
- Broadcast notification creation (`POST /api/notifications/broadcast`).
- Participant inbox management (`GET /api/notifications`).
- Unread notification counting (`GET /api/notifications/unread-count`).
- Marking notifications as read (`PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`).

---

## 🔌 Service Port & Routes
- **Port:** `8007` (Configurable via `PORT_NOTIFICATION`)
- **Gateway Route:** `/api/notifications/*`

---

## 🗄️ Database Tables Owned
- `notifications`: In-app notification items with `user_id`, `title`, `message`, `type` (`INFO`, `ALERT`, `TICKET`, `EVENT_UPDATE`, `TEAM`, `CHECKIN`), `is_read`, `metadata`.

---

## 🩺 Health Check
- `GET /health` -> `{ "success": true, "data": { "status": "healthy", "service": "notification-service" } }`
