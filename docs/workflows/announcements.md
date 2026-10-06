# 📢 Workflow: Announcements & Broadcast System

The Announcement Service enables organizers to broadcast critical updates with priority levels and pinning support.

---

## 🏷️ Priority Levels & UI Rendering

| Priority | Banner Color | Sound / Push | Typical Use Case |
| :--- | :--- | :--- | :--- |
| **`LOW`** | Grey / Blue | None | General informational tips |
| **`NORMAL`** | Blue | Standard in-app | Schedule milestones, workshop starts |
| **`HIGH`** | Orange | In-app + Notification | Meal announcements, mentor availability |
| **`URGENT`** | Red | Toast banner | Submission deadline in 30 mins |
| **`CRITICAL`** | Flashing Red / Modal | Persistent Banner | Emergency, venue evacuation, server maintenance |

---

## 🛠️ API Reference

### 1. Broadcast Announcement
- **Endpoint:** `POST /api/announcements`
- **Headers:** `Authorization: Bearer <Admin_or_TeamLead_JWT>`
- **Body:**
  ```json
  {
    "eventId": "evt-uuid",
    "title": "Hackathon Submission Deadline Extended",
    "content": "Due to network maintenance, submissions will remain open until 2:00 PM.",
    "priority": "URGENT",
    "pinned": true
  }
  ```

### 2. Fetch Announcements
- **Endpoint:** `GET /api/announcements`
- **Query Params:** `eventId=evt-uuid`, `priority=URGENT`
- **Sorting:** Pinned announcements appear first, followed by `created_at DESC`.

### 3. Projector / Stage Display Screen
- **Endpoint:** `GET /api/events/:id/screen`
- **Description:** Returns live data specifically optimized for large auditorium projector screens: current milestone countdown, latest pinned urgent announcement, and live attendee statistics.
