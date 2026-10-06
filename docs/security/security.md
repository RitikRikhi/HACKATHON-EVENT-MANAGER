# 🔒 Security & Privacy Architecture — Event OS

This document details the multi-layered security model safeguarding authentication, role boundaries, QR verification, input sanitization, and data privacy in Event OS.

---

## 🛡️ 1. Authentication & JWT Security

- **Algorithm:** Signed with HMAC-SHA256 (`HS256`) using `JWT_SECRET`.
- **Claims:** Stores non-sensitive metadata (`userId`, `email`, `role`). Never stores password hashes or PII.
- **Expiration:** Configurable lifetime (default: `7d`).
- **Signature Verification:** Verified statelessly in every microservice via `@event-os/config` middleware.

---

## 👥 2. Role-Based Access Control (RBAC)

Event OS enforces a 5-tier role hierarchy:

```text
SUPER_ADMIN (Global superuser, role elevation, retention purges)
     ▲
   ADMIN (Full event lifecycle, seat allocation, judging publishing, exports)
     ▲
 TEAM_LEAD (Team invites, join request approvals, leadership transfers)
     ▲
PARTICIPANT (Event registration, ticket holding, submissions, helpdesk)
     ▲
   USER (Public browsing, account creation)
```

Microservices enforce access using the `authorizeRoles(...)` middleware:
```typescript
router.post(
  '/:id/publish',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  publishController
);
```

---

## 📱 3. HMAC-SHA256 QR Code Cryptography

- **Payload Format:** `<participantId>|<eventId>|<expiry>|<version>|<signature>`
- **Authoritative Verification:** The signing secret `QR_SIGNING_SECRET` is known only to the backend.
- **Expiry Enforcement:** QRs expire automatically after event conclusion.
- **Replay Protection:** Database unique constraints on `(event_id, participant_id, type)` prevent double scanning.

---

## 🛑 4. Rate Limiting & Abuse Prevention

In-memory sliding-window rate limiters are applied to public and interactive endpoints:
- `chatRateLimiter`: Max 5 messages / 10s per participant.
- `questionRateLimiter`: Max 3 questions / minute.
- `ticketRateLimiter`: Max 5 helpdesk tickets / 15 minutes.

---

## 🔒 5. Privacy & Data Retention (GDPR/CCPA)

- **Consent Tracking:** Participant consent timestamp recorded during registration (`consent_at`).
- **Safety / Harassment Routing:** Safety tickets are isolated to Super Admins and lead organizers.
- **Sponsor Privacy Isolation:** Sponsors have access only to aggregate metrics (`GET /api/events/:id/analytics`), never raw participant email lists.
- **Verifiable Deletion:** Purges PII after event closure and issues cryptographic deletion receipt tokens.
