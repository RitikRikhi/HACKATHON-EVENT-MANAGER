# 👥 Workflow: Team Management & Formation

This document explains team creation, role management, member removals, leaving teams, and leadership transfers.

---

## 🔄 Lifecycle Overview

```text
[ Participant Creates Team ] ──► Auto-assigned role: TEAM_LEAD ──► Auto-generated unique team_code
                                                                              │
               ┌──────────────────────────────┬───────────────────────────────┤
               ▼                              ▼                               ▼
       [ Share Team Code ]          [ Share Invite Link ]          [ Match via LFT Pool ]
               │                              │                               │
               ▼                              ▼                               ▼
      Join Request (PENDING)         Join Request (PENDING)           Direct Add / Invitation
               │                              │                               │
               └──────────────────────────────┴───────────────────────────────┘
                                              │
                                              ▼
                             [ Team Lead Reviews & Accepts ]
                                              │
                                              ▼
                                Member added with role: MEMBER
```

---

## 🛠️ API Interactions

### 1. Create Team
- **Endpoint:** `POST /api/teams`
- **Auth:** Bearer JWT
- **Body:**
  ```json
  {
    "name": "Quantum Coders",
    "description": "Building quantum machine learning pipelines",
    "eventId": "e91a62d4-..."
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "t1b94c...",
      "name": "Quantum Coders",
      "team_code": "QC-7193",
      "created_by": "user-uuid"
    }
  }
  ```

### 2. Transfer Leadership
- **Endpoint:** `POST /api/teams/:id/transfer-leadership`
- **Auth:** Bearer JWT (Current Team Lead only)
- **Body:**
  ```json
  {
    "newLeaderId": "usr-829..."
  }
  ```
- **Behavior:** Current Team Lead becomes `MEMBER`; target user is elevated to `TEAM_LEAD`.

### 3. Leave Team
- **Endpoint:** `POST /api/teams/:id/leave`
- **Auth:** Bearer JWT
- **Validation:** If the user is the sole team lead and other members exist, leadership must be transferred before leaving.

### 4. Disband / Delete Team
- **Endpoint:** `DELETE /api/teams/:id`
- **Auth:** Bearer JWT (Team Lead or Admin)
- **Behavior:** Cascades removal of all memberships, join requests, invites, and seat allocations.
