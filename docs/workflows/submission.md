# 🚀 Workflow: Project Submissions & File Uploads

Event OS provides a secure project submission workflow allowing teams to submit Git repositories, live demos, and upload project assets (presentation decks, architecture diagrams, demo videos) up to 30MB.

---

## 🔒 Submission Locking & Rules
- **One Submission Per Team:** Unique constraint on `(event_id, team_id)`.
- **URL Validation:** Repository URLs must be valid HTTP/HTTPS URLs (e.g. GitHub, GitLab).
- **Locking:** Teams can set `lock: true` to prevent accidental edits once final judging begins.

---

## 🔄 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor TeamMember as Team Member
    participant UI as Frontend App
    participant Gateway as API Gateway
    participant EventSvc as Event Service
    participant DB as Supabase PostgreSQL

    TeamMember->>UI: Uploads Presentation Deck (PDF / PPTX)
    UI->>Gateway: POST /api/uploads (multipart or base64 data)
    Gateway->>EventSvc: Store upload record & validate size <= 30MB
    EventSvc->>DB: Insert uploads record
    EventSvc-->>UI: 201 Created { file_url: "https://..." }

    TeamMember->>UI: Fills Submission Form (GitHub Repo, Demo URL, Description)
    UI->>Gateway: POST /api/submissions
    Note over UI,Gateway: Body: { repoUrl, demoUrl, description, fileUrl, lock: true }
    Gateway->>EventSvc: Save project submission
    EventSvc->>DB: Upsert into submissions table
    EventSvc-->>UI: 201 Created (Submission confirmed & locked)
```

---

## 🛠️ API Reference

### 1. Submit Project
- **Endpoint:** `POST /api/submissions`
- **Headers:** `Authorization: Bearer <JWT>`
- **Body:**
  ```json
  {
    "repoUrl": "https://github.com/quantum-coders/qml-pipeline",
    "demoUrl": "https://qml-demo.vercel.app",
    "description": "Quantum machine learning pipeline for drug discovery",
    "fileUrl": "https://storage.eventos.internal/uploads/deck.pdf",
    "lock": true
  }
  ```

### 2. View Team Submission
- **Endpoint:** `GET /api/submissions/team/:teamId`

### 3. Upload File
- **Endpoint:** `POST /api/uploads`
- **Body:**
  ```json
  {
    "fileName": "pitch-deck.pdf",
    "mimeType": "application/pdf",
    "fileSize": 4194304,
    "category": "PRESENTATION",
    "fileData": "base64-or-multipart-payload..."
  }
  ```
