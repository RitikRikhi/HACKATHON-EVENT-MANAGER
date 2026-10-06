# 🤝 Workflow: Team Connections & Networking

Team Connections allow teams to safely network, share project descriptions, and explore collaboration during hackathons and conferences without exposing private participant contact details.

---

## 🔒 Privacy & Safety Model
- **Public Profile:** Shows only team name, track, and high-level description.
- **Connected Profile:** Shows member skills, GitHub profiles, and team demo links.
- **Safety Reporting & Blocking:** Any team lead can block and report another team. Blocked teams cannot send connection requests, and organizers receive an audit alert.

---

## 🔄 Lifecycle

```text
[ Team A Lead ] ──► Sends Connection Request ──► POST /api/teams/:id/connections
                                                              │
                                                              ▼
                                               [ Status: PENDING ]
                                                              │
                    ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
                    ▼                                                                                   ▼
      [ Team B Lead Accepts ]                                                             [ Team B Lead Rejects / Blocks ]
      Status: ACCEPTED                                                                    Status: REJECTED / BLOCKED
      Full team profile unlocked for both teams                                           Connection terminated
```

---

## 🛠️ API Reference

### 1. Send Connection Request
- **Endpoint:** `POST /api/teams/:id/connections`
- **Body:** `{ "targetTeamId": "target-team-uuid" }`

### 2. Accept Connection
- **Endpoint:** `POST /api/teams/:id/connections/:connectionId/accept`

### 3. Block and Report
- **Endpoint:** `POST /api/teams/:id/block`
- **Body:**
  ```json
  {
    "targetTeamId": "abusive-team-uuid",
    "reason": "Harassing messages sent in physical hall"
  }
  ```
