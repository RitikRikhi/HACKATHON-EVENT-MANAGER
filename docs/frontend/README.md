# 🎨 Frontend Engineer Integration Guide — Event OS

Welcome to the frontend integration guide for Event OS. This document will get any frontend engineer completely up to speed without needing direct assistance from backend engineers.

---

## ⚡ 1. The Single Base URL

Every request from your React, Vue, Next.js, or mobile client must go through the **API Gateway**:

```text
http://localhost:8000
```
*(In production, this will be your hosted domain, e.g. `https://api.eventos.yourdomain.com`)*

---

## 🔐 2. Authentication Flow & JWT Token Handling

```text
[ Registration / Login ] ──► Receive JWT Token ──► Store in localStorage / Secure Storage
                                                                │
                                                                ▼
                                      Attach Header to All Protected Requests:
                                      Authorization: Bearer <JWT_TOKEN>
```

### Exact Header Format:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### What Login Returns:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c1f7b8d4-5e12-4d2b-9e4a-1a2b3c4d5e6f",
      "name": "Alice Engineer",
      "email": "alice@example.com",
      "role": "PARTICIPANT",
      "phone": null,
      "profileImage": null,
      "created_at": "2026-10-06T12:00:00.000Z",
      "updated_at": "2026-10-06T12:00:00.000Z"
    }
  }
}
```

### Expiration & 401 Behavior:
- The default token expiration is **7 days**.
- When an API responds with `401 Unauthorized`, your API client interceptor should:
  1. Remove `token` from `localStorage` / `sessionStorage`.
  2. Redirect the user to `/login`.
  3. Show a toast: `"Your session has expired. Please log in again."`

---

## 🏗️ 3. Recommended Frontend Project Architecture

We recommend structuring your frontend API layer as follows:

```text
src/
├── api/
│   ├── client.ts         # Axios / Fetch wrapper with auth interceptor
│   ├── auth.ts           # Login, Register, Me, Change Password
│   ├── events.ts         # Event CRUD, Registration, Tracks, Seats
│   ├── teams.ts          # Teams, Join codes, Invites, Connections
│   ├── tickets.ts        # Tickets, QR retrieval, Helpdesk
│   ├── checkin.ts        # Scanner verification, Offline sync
│   ├── announcements.ts  # Announcements, Chat, Q&A, Polls
│   ├── submissions.ts    # Submissions, File uploads
│   └── results.ts        # Scores, Leaderboards, Remarks
```

---

## 💻 4. Production-Ready Axios Client (`src/api/client.ts`)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('event_os_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401s & Errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('event_os_token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 🏷️ 5. Standard Roles & Enum Constants

Frontend applications should use the exact backend enum strings:

```typescript
export enum UserRole {
  USER = 'USER',
  PARTICIPANT = 'PARTICIPANT',
  TEAM_LEAD = 'TEAM_LEAD',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ScanType {
  CHECKIN = 'CHECKIN',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SWAG = 'SWAG',
}

export enum HelpdeskCategory {
  MENTOR = 'MENTOR',
  TECHNICAL = 'TECHNICAL',
  FOOD = 'FOOD',
  FACILITIES = 'FACILITIES',
  WIFI = 'WIFI',
  SAFETY = 'SAFETY',
  HARASSMENT = 'HARASSMENT',
}
```
