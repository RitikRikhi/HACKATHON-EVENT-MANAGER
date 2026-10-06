# 🚀 Frontend Integration Quickstart (15 Core Questions)

This cheat sheet answers the 15 most frequent frontend developer questions with concrete code examples.

---

### 1. What is the API Base URL?
```text
http://localhost:8000
```
All routes begin with `/api/` (except `/health`).

---

### 2. How do I authenticate?
```typescript
const response = await apiClient.post('/api/auth/login', {
  email: 'alice@example.com',
  password: 'Password123!'
});
localStorage.setItem('event_os_token', response.data.data.token);
```

---

### 3. How do I register a new account?
```typescript
const response = await apiClient.post('/api/auth/register', {
  name: 'Alice Participant',
  email: 'alice@example.com',
  password: 'Password123!',
  role: 'PARTICIPANT'
});
```

---

### 4. How do I fetch events?
```typescript
const response = await apiClient.get('/api/events', {
  params: { status: 'PUBLISHED', page: 1, limit: 10 }
});
const events = response.data.data.items;
```

---

### 5. How do I register for an event?
```typescript
const response = await apiClient.post(`/api/events/${eventId}/register`, {
  college: 'MIT',
  skills: ['React', 'TypeScript', 'Node.js'],
  consent: true,
  lookingForTeam: false
});
```

---

### 6. How do I create and join a team?
```typescript
// Create Team
const teamRes = await apiClient.post('/api/teams', {
  name: 'Binary Beasts',
  description: 'AI track competitors',
  eventId: eventId
});
const teamCode = teamRes.data.data.team_code;

// Join Team via Code
await apiClient.post('/api/teams/join', { teamCode });
```

---

### 7. How do I get my ticket and QR code data?
```typescript
const response = await apiClient.get('/api/tickets');
const myTicket = response.data.data.find(t => t.event_id === eventId);
const qrPayload = myTicket.qr_data; // Feed this string into your QRCode SVG renderer
```

---

### 8. How does check-in scanning work for gate volunteers?
```typescript
const response = await apiClient.post('/api/checkin/scan', {
  qrString: scannedStringFromCamera,
  eventId: eventId,
  type: 'CHECKIN' // or 'LUNCH', 'DINNER', 'SWAG'
});
```

---

### 9. How do I fetch announcements?
```typescript
const response = await apiClient.get('/api/announcements', {
  params: { eventId: eventId }
});
const announcements = response.data.data;
```

---

### 10. How does community chat work?
```typescript
// Fetch recent messages
const chatRes = await apiClient.get('/api/chat/messages', {
  params: { eventId: eventId, channel: 'general' }
});

// Post a new message
await apiClient.post('/api/chat/messages', {
  channel: 'general',
  body: 'Hello everyone in the hackathon!'
});
```

---

### 11. How do I create a support helpdesk ticket?
```typescript
const response = await apiClient.post('/api/helpdesk', {
  category: 'TECHNICAL', // 'MENTOR' | 'TECHNICAL' | 'WIFI' | 'SAFETY' | etc.
  description: 'Our team table power strip is not working.'
});
```

---

### 12. How do I submit my team's project?
```typescript
const response = await apiClient.post('/api/submissions', {
  repoUrl: 'https://github.com/myteam/project-repo',
  demoUrl: 'https://myproject.vercel.app',
  description: 'Autonomous agent that monitors IoT devices',
  lock: true
});
```

---

### 13. How do I view published results?
```typescript
const response = await apiClient.get('/api/results', {
  params: { eventId: eventId }
});
const leaderboard = response.data.data;
```

---

### 14. How do I handle common API errors?
```typescript
try {
  await apiClient.post(`/api/events/${eventId}/register`, payload);
} catch (err: any) {
  if (err.response?.status === 409) {
    alert("You are already registered for this event!");
  } else if (err.response?.status === 429) {
    alert("Please wait a minute before trying again.");
  }
}
```

---

### 15. Which endpoints require which user roles?
- **Public / Any User:** `/api/auth/login`, `/api/auth/register`, `GET /api/events`, `GET /api/announcements`, `GET /api/results`.
- **Authenticated Participant:** `POST /api/events/:id/register`, `POST /api/teams`, `POST /api/tickets`, `POST /api/submissions`, `POST /api/helpdesk`, `POST /api/chat/messages`.
- **Team Lead:** `POST /api/teams/:id/invite-link`, `POST /api/teams/:id/join-requests/:requestId/accept`, `POST /api/teams/:id/transfer-leadership`.
- **Judge:** `POST /api/results/scores`, `GET /api/submissions`.
- **Staff / Volunteer:** `POST /api/checkin/scan`, `GET /api/checkin/roster/:eventId`, `PATCH /api/helpdesk/:id`.
- **Organizer / Admin:** `POST /api/events`, `PUT /api/events/:id`, `POST /api/events/:id/seats/allocate`, `POST /api/results/publish`, `POST /api/events/:id/export`.
- **Super Admin:** `PATCH /api/auth/users/:id/role`.
