# ✅ Check-in Service

The **Check-in Service** handles venue entry verification, multi-checkpoint scanning (`CHECKIN`, `LUNCH`, `DINNER`, `SWAG`), offline roster caching, batch offline scan synchronization, and attendance metrics.

---

## 🎯 Key Responsibilities
- Instant QR code verification using HMAC-SHA256 signature checking.
- Multi-checkpoint logging with deduplication and idempotency keys.
- Offline Roster generation (`GET /api/checkin/roster/:eventId`) for low-connectivity environments.
- Batch synchronization of scans collected offline (`POST /api/checkin/sync`).
- Printed roster fallback reconciliation (`POST /api/checkin/reconcile-printed`).
- Real-time event attendance counts and analytics (`GET /api/checkin/stats/:eventId`).

---

## 🔌 Service Port & Routes
- **Port:** `8005` (Configurable via `PORT_CHECKIN`)
- **Gateway Route:** `/api/checkin/*`

---

## 🗄️ Database Tables Owned
- `checkins`: Main event gate entry records.
- `scan_logs`: Multi-checkpoint logs (`CHECKIN`, `LUNCH`, `DINNER`, `SWAG`) with idempotency keys.

---

## 🩺 Health Check
- `GET /health` -> `{ "success": true, "data": { "status": "healthy", "service": "checkin-service" } }`
