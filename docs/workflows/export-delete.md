# 📦 Workflow: Export, Data Retention & Verifiable Deletion

Event OS respects strict privacy boundaries (GDPR / CCPA) through automated event retention periods and cryptographically signed deletion receipts.

---

## ⏳ Retention Lifecycle

```text
[ Event Closes ] ──► POST /api/events/:id/close (Sets is_closed: true, closed_at: NOW())
                             │
                             ▼
              [ Retention Countdown (Default: 30 Days) ]
                             │
                             ▼
            [ Automated / Manual Retention Purge ]
            POST /api/events/:id/retention/cleanup
                             │
                             ▼
    ┌────────────────────────┴────────────────────────┐
    ▼                                                 ▼
[ Purges Database Rows & Uploads ]        [ Issues Deletion Receipt ]
Event registrations, tickets, scans,      Cryptographic receipt token stored
chat messages, submissions deleted        GET /api/events/:id/retention/receipt
```

---

## 🛠️ API Reference

### 1. Generate Full Event Export
- **Endpoint:** `POST /api/events/:id/export`
- **Headers:** `Authorization: Bearer <Admin_JWT>`
- **Response:** Complete JSON dump containing event details, attendee rosters, check-in records, teams, submissions, judging scorecards, and results.

### 2. Run Retention Cleanup
- **Endpoint:** `POST /api/events/:id/retention/cleanup`
- **Headers:** `Authorization: Bearer <SuperAdmin_JWT>`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Retention cleanup completed",
    "data": {
      "receiptToken": "del_rcpt_8491a0f92b7c...",
      "recordsDeleted": 418,
      "storageFilesDeleted": 26,
      "deletedAt": "2026-10-06T18:00:00.000Z"
    }
  }
  ```

### 3. Verify Deletion Receipt
- **Endpoint:** `GET /api/events/:id/retention/receipt`
- **Response:** Public proof that event participant PII was purged according to data retention policy.
