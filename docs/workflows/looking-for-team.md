# 🔍 Workflow: Looking-For-Team (LFT) Matchmaking Pool

The Looking-for-Team (LFT) system allows registered attendees who do not have a team to discover and match with each other or get recruited by team leads looking for specific skill sets.

---

## 🔄 Lifecycle

```text
[ Participant Registers for Event ] ──► Toggles looking_for_team: true
                                                      │
                                                      ▼
                       [ Profile Listed in Public LFT Directory for Event ]
                               (Shows name, college, skills, github link)
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
           [ Team Lead Discovers Profile ]                              [ Another Solo Participant ]
           Directly invites to team:                                    Reaches out to form new team
           POST /api/teams/:id/members                                  POST /api/teams
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │
                                                      ▼
                                   [ Participant Joins a Team ]
                                                      │
                                                      ▼
                                  looking_for_team automatically set to false
```

---

## 🛠️ API Reference

### 1. Toggle LFT Status
- **Endpoint:** `PATCH /api/events/:id/looking-for-team`
- **Auth:** Bearer JWT
- **Body:** `{ "lookingForTeam": true }`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Looking for team status updated",
    "data": {
      "looking_for_team": true
    }
  }
  ```

### 2. View LFT Pool
- **Endpoint:** `GET /api/events/:id/looking-for-team`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "userId": "usr-1",
        "name": "David Dev",
        "college": "Berkeley",
        "skills": ["Solidity", "Rust", "Backend"],
        "socialLinks": { "github": "https://github.com/david" }
      }
    ]
  }
  ```
