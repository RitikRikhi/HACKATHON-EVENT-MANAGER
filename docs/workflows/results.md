# 🏆 Workflow: Results & Leaderboard Publishing

The Results workflow governs the transition of judging scores into official public standings.

---

## 🔒 3-Stage Publishing Pipeline

```text
[ DRAFT ] ──► All judging scores aggregated by backend; visible ONLY to Organizers.
    │
    ▼
[ REVIEW ] ──► Lead Organizers review rankings, apply tie-breaking rules, verify eligibility.
    │
    ▼
[ PUBLISHED ] ──► Publicly visible to all participants, guests, and projector displays.
```

---

## 🛠️ API Reference

### 1. Publish / Update Results Stage
- **Endpoint:** `POST /api/results/publish`
- **Headers:** `Authorization: Bearer <Admin_JWT>`
- **Body:**
  ```json
  {
    "status": "PUBLISHED",
    "payload": {
      "winners": [
        { "rank": 1, "teamName": "Quantum Coders", "track": "AI", "prize": "$5,000" },
        { "rank": 2, "teamName": "Neural Navigators", "track": "Web3", "prize": "$2,500" }
      ],
      "trackWinners": {
        "AI": "Quantum Coders",
        "FinTech": "BlockPay"
      }
    }
  }
  ```

### 2. View Results (Frontend / Public)
- **Endpoint:** `GET /api/results?eventId=evt-uuid`
- **Visibility:**
  - If status is `DRAFT` or `REVIEW`, participants receive `404 Not Found` or `{ status: "PENDING_PUBLICATION" }`.
  - If status is `PUBLISHED`, returns complete winner payload and leaderboard.
