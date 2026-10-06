# 🔗 Workflow: Team Invitation & Approval Flow

Event OS supports two invitation methods: **Short Join Codes** and **Tokenized Shareable Invite Links**. Both flows require Team Lead approval before the applicant becomes an active member.

---

## 🎟️ Flow A: Join via Team Short Code

```mermaid
sequenceDiagram
    autonumber
    actor Bob as Applicant (Bob)
    participant UI as Frontend
    participant Gateway as API Gateway
    participant TeamSvc as Team Service
    actor Alice as Team Lead (Alice)

    Bob->>UI: Enters Short Code (e.g. "QC-7193")
    UI->>Gateway: POST /api/teams/join { teamCode: "QC-7193" }
    Gateway->>TeamSvc: Create join request
    TeamSvc-->>UI: 201 Created { request: { id: "req-1", status: "PENDING" } }
    UI-->>Bob: Show "Join Request Submitted. Awaiting Leader Approval."

    Alice->>UI: Opens Team Dashboard
    UI->>Gateway: GET /api/teams/:id/join-requests
    Gateway->>TeamSvc: Fetch pending requests
    TeamSvc-->>UI: List of applicants with profiles & skills

    Alice->>UI: Clicks "Accept Applicant"
    UI->>Gateway: POST /api/teams/:id/join-requests/req-1/accept
    Gateway->>TeamSvc: Transition request to ACCEPTED & insert team_members
    TeamSvc-->>UI: 200 OK (Bob is now MEMBER)
```

---

## 🌐 Flow B: Join via Tokenized Invite Link

### 1. Lead Generates Link
- **Endpoint:** `POST /api/teams/:id/invite-link`
- **Body:**
  ```json
  {
    "expiresInHours": 48,
    "maxUses": 4
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "token": "inv_9f82ab7c10...",
      "expires_at": "2026-10-08T12:00:00.000Z",
      "invite_url": "http://localhost:3000/teams/invite/inv_9f82ab7c10..."
    }
  }
  ```

### 2. Applicant Opens Link
- **Endpoint:** `GET /api/teams/invite/:token`
- **Response:** Returns team metadata, event name, creator name, and active member count.

### 3. Applicant Submits Link Join Request
- **Endpoint:** `POST /api/teams/invite/:token/join`
- **Response:** Creates `team_join_requests` with status `PENDING`.
- **Team Lead Approval:** The Team Lead reviews and approves at `POST /api/teams/:id/join-requests/:requestId/accept`.
