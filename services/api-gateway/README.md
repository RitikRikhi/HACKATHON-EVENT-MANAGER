# 🌐 API Gateway Service

The **API Gateway** is the single entry point for all frontend client traffic and external web clients in Event OS. It listens on port `8000` and reverse-proxies incoming requests to the 7 downstream microservices based on route prefixes.

---

## 🎯 Key Responsibilities
- **Reverse Proxy Routing**: Directs `/api/auth`, `/api/events`, `/api/teams`, `/api/tickets`, `/api/helpdesk`, `/api/checkin`, `/api/announcements`, `/api/chat`, `/api/questions`, `/api/polls`, `/api/submissions`, `/api/results`, `/api/remarks`, `/api/uploads`, and `/api/notifications` to corresponding microservices.
- **Contextual Auth Header Forwarding**: Extracts and decodes JWT from the `Authorization: Bearer <token>` header, attaching downstream headers:
  - `x-user-id`: Authenticated user UUID
  - `x-user-email`: Authenticated user email
  - `x-user-role`: User role (`USER`, `PARTICIPANT`, `TEAM_LEAD`, `ADMIN`, `SUPER_ADMIN`)
- **Global Security**: Applies Helmet headers, CORS policies, and request body size limits (30MB for file uploads).
- **Service Health Aggregation**: Exposes comprehensive `/api/system/status` and `/health` endpoints.

---

## 🔌 Service Port & URLs
- **Port:** `8000` (Configurable via `PORT_GATEWAY`)
- **Local URL:** `http://localhost:8000`

---

## ⚙️ Environment Variables
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT_GATEWAY` | Listening port for the Gateway | `8000` |
| `JWT_SECRET` | Secret key used to decode token claims | `super_secret_jwt_key...` |
| `AUTH_SERVICE_URL` | Auth Microservice target URL | `http://localhost:8001` |
| `EVENT_SERVICE_URL` | Event Microservice target URL | `http://localhost:8002` |
| `TEAM_SERVICE_URL` | Team Microservice target URL | `http://localhost:8003` |
| `TICKET_SERVICE_URL` | Ticket Microservice target URL | `http://localhost:8004` |
| `CHECKIN_SERVICE_URL` | Check-in Microservice target URL | `http://localhost:8005` |
| `ANNOUNCEMENT_SERVICE_URL` | Announcement Microservice target URL | `http://localhost:8006` |
| `NOTIFICATION_SERVICE_URL` | Notification Microservice target URL | `http://localhost:8007` |

---

## 🩺 Health Check
- `GET /health` -> `{ "success": true, "data": { "status": "Operational", "gateway": "event-os-api-gateway" } }`
- `GET /api/system/status` -> Live health status of all downstream services and Supabase database.
