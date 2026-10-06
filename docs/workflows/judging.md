# ⚖️ Workflow: Judging & Scoring System

The Judging module enables assigned judges and organizers to evaluate team submissions against multiple rubric criteria (e.g. Innovation, Technical Depth, UI/UX, Presentation).

---

## 🏗️ Scorecard Rubric Structure

Each judge submits a JSON scorecard:

```json
{
  "teamId": "team-uuid",
  "criteria": {
    "innovation": 25,
    "technicalComplexity": 30,
    "uiUx": 20,
    "businessImpact": 15,
    "presentation": 10
  },
  "feedback": "Outstanding implementation of quantum circuits with a polished Next.js dashboard."
}
```

The backend automatically sums the criteria scores into a normalized `total` field (max 100.00).

---

## 🔄 Judging Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Judge as Assigned Judge
    participant UI as Judge Portal UI
    participant Gateway as API Gateway
    participant EventSvc as Event Service
    participant DB as Supabase PostgreSQL

    Judge->>UI: Views Assigned Team Submission
    UI->>Gateway: GET /api/submissions/team/:teamId
    Gateway-->>UI: Repo URL, Demo URL, Description

    Judge->>UI: Scores Submission (Criteria 1..5 & Feedback)
    UI->>Gateway: POST /api/results/scores
    Gateway->>EventSvc: Save judging scorecard
    EventSvc->>DB: Upsert scores WHERE (event_id, team_id, judge_id)
    DB-->>EventSvc: Confirmed
    EventSvc-->>UI: 201 Created (Score recorded)
```

---

## 🛠️ API Reference

### 1. Submit Scorecard
- **Endpoint:** `POST /api/results/scores`
- **Headers:** `Authorization: Bearer <Judge_JWT>`
- **Body:**
  ```json
  {
    "teamId": "team-uuid",
    "criteria": { "technical": 40, "novelty": 30, "pitch": 30 },
    "feedback": "Great live demonstration."
  }
  ```

### 2. List Judging Scores (Admins & Judges)
- **Endpoint:** `GET /api/results/scores?eventId=evt-uuid`
