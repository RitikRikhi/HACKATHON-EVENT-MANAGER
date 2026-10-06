# 📖 API Index — Event OS Master Endpoints Reference

All client requests must be made to the **API Gateway** (`http://localhost:8000`).

---

## 📑 Summary of Domains
1. [Authentication & Users](#1-authentication--users)
2. [Events Management](#2-events-management)
3. [Participant Registration](#3-participant-registration)
4. [Looking For Team (LFT) Pool](#4-looking-for-team-lft-pool)
5. [Event Members & Roles](#5-event-members--roles)
6. [Tracks, Rooms & Seats](#6-tracks-rooms--seats)
7. [Teams Management](#7-teams-management)
8. [Team Invitations & Join Requests](#8-team-invitations--join-requests)
9. [Team Connections & Safety](#9-team-connections--safety)
10. [Ticketing](#10-ticketing)
11. [Check-in & Scanning](#11-check-in--scanning)
12. [Helpdesk & Support](#12-helpdesk--support)
13. [Announcements](#13-announcements)
14. [Community Chat](#14-community-chat)
15. [Questions (Live Q&A)](#15-questions-live-qa)
16. [Interactive Polls](#16-interactive-polls)
17. [Submissions & File Uploads](#17-submissions--file-uploads)
18. [Judging, Results & Remarks](#18-judging-results--remarks)
19. [Sponsors, Analytics, Retention & Notifications](#19-sponsors-analytics-retention--notifications)

---

## 1. Authentication & Users
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Any | Register user account & trigger welcome email |
| `POST` | `/api/auth/login` | Public | Any | Authenticate & return signed JWT with profile |
| `GET` | `/api/auth/me` | Bearer JWT | Authenticated | Get current authenticated user profile |
| `PUT` | `/api/auth/profile` | Bearer JWT | Authenticated | Update profile details (name, phone, profileImage) |
| `PUT` | `/api/auth/change-password` | Bearer JWT | Authenticated | Change account password with current verification |
| `GET` | `/api/auth/users/:id` | Bearer JWT | Authenticated | Get public user profile by ID |
| `GET` | `/api/auth/users` | Bearer JWT | Admin / Super Admin | Paginated user directory |
| `PATCH`| `/api/auth/users/:id/role` | Bearer JWT | Super Admin | Change user global system role |

---

## 2. Events Management
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Optional | Any | List events (filters: `eventType`, `status`, `search`) |
| `GET` | `/api/events/:id` | Optional | Any | Get detailed event details and registration status |
| `GET` | `/api/events/join/:code` | Public | Any | Look up event by short join code |
| `GET` | `/api/events/:id/screen` | Public | Any | Projector / Display screen mode for live stages |
| `POST` | `/api/events` | Bearer JWT | Admin / Team Lead | Create new event with venue and capacity |
| `PUT` | `/api/events/:id` | Bearer JWT | Creator / Admin | Update event configuration |
| `POST` | `/api/events/:id/publish`| Bearer JWT | Creator / Admin | Transition event status to `PUBLISHED` |
| `POST` | `/api/events/:id/close` | Bearer JWT | Creator / Admin | Close event registration and activity |
| `DELETE`| `/api/events/:id` | Bearer JWT | Creator / Admin | Delete event and cascade associated records |

---

## 3. Participant Registration
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/events/:id/register` | Bearer JWT | Authenticated | Register authenticated participant for event |
| `GET` | `/api/events/:id/registration` | Bearer JWT | Authenticated | Get user's active registration for this event |
| `PUT` | `/api/events/:id/profile` | Bearer JWT | Authenticated | Update participant profile (college, skills, social) |
| `DELETE`| `/api/events/:id/register` | Bearer JWT | Authenticated | Cancel participant registration |
| `GET` | `/api/events/:id/participants` | Optional | Any | List registered participants (paginated) |

---

## 4. Looking For Team (LFT) Pool
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/events/:id/looking-for-team` | Optional | Any | List registered participants seeking a team |
| `PATCH`| `/api/events/:id/looking-for-team` | Bearer JWT | Authenticated | Toggle participant's looking-for-team status |

---

## 5. Event Members & Roles
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/events/:id/members` | Optional | Any | List event staff, judges, mentors, volunteers |
| `POST` | `/api/events/:id/members` | Bearer JWT | Organizer / Admin | Add user as event role (`JUDGE`, `MENTOR`, etc.) |
| `DELETE`| `/api/events/:id/members/:userId` | Bearer JWT | Organizer / Admin | Remove user's event role |

---

## 6. Tracks, Rooms & Seats
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/events/:id/tracks` | Optional | Any | List event tracks / hackathon themes |
| `POST` | `/api/events/:id/tracks` | Bearer JWT | Organizer / Admin | Create a new event track |
| `GET` | `/api/events/:id/rooms` | Optional | Any | List event rooms and halls |
| `POST` | `/api/events/:id/rooms` | Bearer JWT | Organizer / Admin | Create a venue room with capacity |
| `GET` | `/api/events/:id/seats` | Optional | Any | List seat labels and assigned teams |
| `POST` | `/api/events/:id/seats/allocate` | Bearer JWT | Organizer / Admin | Execute algorithmic team seat allocation |
| `POST` | `/api/events/:id/seats/manual` | Bearer JWT | Organizer / Admin | Manually assign a team to room/seat label |
| `POST` | `/api/events/:id/seats/swap` | Bearer JWT | Organizer / Admin | Swap seat assignments between two teams |

---

## 7. Teams Management
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/teams` | Public | Any | List teams (filter: `eventId`) |
| `POST` | `/api/teams` | Bearer JWT | Authenticated | Create a new team (creator becomes `TEAM_LEAD`) |
| `GET` | `/api/teams/my` | Bearer JWT | Authenticated | List all teams current user belongs to |
| `GET` | `/api/teams/:id` | Public | Any | Get team details, track, seat, and member roster |
| `DELETE`| `/api/teams/:id` | Bearer JWT | Team Lead / Admin | Disband / delete team |
| `GET` | `/api/teams/:id/members` | Public | Any | Get list of team members |
| `POST` | `/api/teams/:id/members` | Bearer JWT | Team Lead / Admin | Directly add a member to team |
| `DELETE`| `/api/teams/:id/members/:userId` | Bearer JWT | Team Lead / Self | Remove member from team |
| `POST` | `/api/teams/:id/leave` | Bearer JWT | Authenticated | Leave team (if not sole lead) |
| `POST` | `/api/teams/:id/transfer-leadership` | Bearer JWT | Team Lead | Transfer team lead ownership to a member |

---

## 8. Team Invitations & Join Requests
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/teams/code/:code` | Public | Any | Look up team metadata by short join code |
| `POST` | `/api/teams/join` | Bearer JWT | Authenticated | Submit join request using team short code |
| `POST` | `/api/teams/:id/invite-link` | Bearer JWT | Team Lead | Generate shareable invite link with token |
| `GET` | `/api/teams/invite/:token` | Public | Any | Inspect invite link validity and team metadata |
| `POST` | `/api/teams/invite/:token/join` | Bearer JWT | Authenticated | Submit join request via invite token |
| `GET` | `/api/teams/:id/join-requests` | Bearer JWT | Team Lead / Admin | View pending join requests for team |
| `POST` | `/api/teams/:id/join-requests/:requestId/accept` | Bearer JWT | Team Lead / Admin | Accept applicant into team as `MEMBER` |
| `POST` | `/api/teams/:id/join-requests/:requestId/reject` | Bearer JWT | Team Lead / Admin | Reject applicant's join request |

---

## 9. Team Connections & Safety
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/teams/:id/connections` | Bearer JWT | Team Lead | Send connection request to target team |
| `GET` | `/api/teams/:id/connections` | Bearer JWT | Team Member | List active & pending cross-team connections |
| `POST` | `/api/teams/:id/connections/:connId/accept` | Bearer JWT | Team Lead | Accept incoming connection request |
| `POST` | `/api/teams/:id/connections/:connId/reject` | Bearer JWT | Team Lead | Reject connection request |
| `POST` | `/api/teams/:id/block` | Bearer JWT | Team Lead | Block and report inappropriate team |
| `GET` | `/api/teams/:id/connected-profile` | Bearer JWT | Connected Team | View full profile of accepted connected team |

---

## 10. Ticketing
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/tickets` | Bearer JWT | Authenticated | Generate/book event ticket with QR payload |
| `GET` | `/api/tickets` | Bearer JWT | Authenticated | List tickets (User sees own; Admin sees all) |
| `GET` | `/api/tickets/:id` | Bearer JWT | Owner / Admin | Get ticket details and QR code data |
| `GET` | `/api/tickets/code/:code` | Bearer JWT | Authenticated | Look up ticket by code (`TKT-...`) |
| `POST` | `/api/tickets/:id/validate` | Public / Internal | Any | Check ticket validity for venue entry |
| `PATCH`| `/api/tickets/:id/status` | Bearer JWT | Admin / Gate | Update ticket status (`ACTIVE`, `USED`, `CANCELLED`) |

---

## 11. Check-in & Scanning
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/checkin/scan` | Bearer JWT | Staff / Volunteer | Scan & verify QR for `CHECKIN`, `LUNCH`, `DINNER`, `SWAG` |
| `POST` | `/api/checkin` | Bearer JWT | Staff / Volunteer | Standard ticket code check-in |
| `GET` | `/api/checkin/roster/:eventId` | Public / Staff | Any | Download offline check-in roster cache |
| `POST` | `/api/checkin/sync` | Bearer JWT | Staff / Volunteer | Batch sync scans collected offline |
| `POST` | `/api/checkin/reconcile-printed` | Bearer JWT | Organizer / Admin | Reconcile physical printed roster entries |
| `GET` | `/api/checkin/scans/:eventId` | Optional | Staff / Admin | List scan audit records for event |
| `GET` | `/api/checkin/stats/:eventId` | Bearer JWT | Staff / Admin | Live attendee and checkpoint counts |
| `GET` | `/api/checkin/event/:eventId` | Bearer JWT | Staff / Admin | Complete attendee attendance roster |
| `GET` | `/api/checkin/user/:userId` | Bearer JWT | Authenticated | User's personal check-in history |

---

## 12. Helpdesk & Support
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/helpdesk` | Bearer JWT | Authenticated | Create support ticket with auto-resolved room/seat |
| `GET` | `/api/helpdesk` | Bearer JWT | Authenticated | List helpdesk tickets (User sees own; Staff sees all) |
| `GET` | `/api/helpdesk/:id` | Bearer JWT | Owner / Staff | Get helpdesk ticket details & participant location |
| `PATCH`| `/api/helpdesk/:id` | Bearer JWT | Staff / Mentor | Update ticket status (`ASSIGNED`, `RESOLVED`) & assign |

---

## 13. Announcements
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/announcements` | Public | Any | List announcements (filters: `eventId`, `priority`) |
| `GET` | `/api/announcements/:id` | Public | Any | Get announcement details |
| `POST` | `/api/announcements` | Bearer JWT | Admin / Team Lead | Broadcast official announcement |
| `PUT` | `/api/announcements/:id` | Bearer JWT | Creator / Admin | Update announcement title/content/priority/pinned |
| `DELETE`| `/api/announcements/:id` | Bearer JWT | Creator / Admin | Delete announcement |

---

## 14. Community Chat
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/chat/messages` | Optional | Any | Fetch channel messages (filter: `eventId`, `channel`) |
| `POST` | `/api/chat/messages` | Bearer JWT | Authenticated | Post message to channel (rate-limited) |
| `DELETE`| `/api/chat/messages/:id` | Bearer JWT | Author / Admin | Soft delete chat message |
| `POST` | `/api/chat/mute` | Bearer JWT | Organizer / Admin | Mute disruptive participant in chat |

---

## 15. Questions (Live Q&A)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/questions` | Optional | Any | List live stage Q&A questions (filter: `eventId`) |
| `POST` | `/api/questions` | Bearer JWT | Authenticated | Submit question for live session (rate-limited) |
| `POST` | `/api/questions/:id/upvote` | Bearer JWT | Authenticated | Toggle upvote on question |
| `POST` | `/api/questions/:id/answer` | Bearer JWT | Organizer / Speaker| Answer submitted question |

---

## 16. Interactive Polls
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/polls` | Optional | Any | List interactive event polls (filter: `eventId`) |
| `POST` | `/api/polls` | Bearer JWT | Organizer / Admin | Create poll with multiple choice options |
| `POST` | `/api/polls/:id/vote` | Bearer JWT | Authenticated | Submit vote for an option |
| `POST` | `/api/polls/:id/close` | Bearer JWT | Organizer / Admin | Close voting on poll |

---

## 17. Submissions & File Uploads
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/submissions` | Bearer JWT | Team Member | Submit project (repo URL, demo URL, lock) |
| `GET` | `/api/submissions` | Bearer JWT | Authenticated | List all submissions for event (Judges/Admins) |
| `GET` | `/api/submissions/team/:teamId` | Bearer JWT | Authenticated | Get team's project submission |
| `POST` | `/api/uploads` | Bearer JWT | Authenticated | Upload file (multipart / base64 up to 30MB) |
| `GET` | `/api/uploads` | Bearer JWT | Authenticated | List uploaded files for event |
| `GET` | `/api/uploads/:id` | Bearer JWT | Authenticated | Get upload metadata & download URL |

---

## 18. Judging, Results & Remarks
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/results/scores` | Bearer JWT | Judge / Admin | Submit multi-criteria scorecard for team |
| `GET` | `/api/results/scores` | Bearer JWT | Judge / Admin | List judging scorecards for event |
| `GET` | `/api/results` | Optional | Any | View published event leaderboard and results |
| `POST` | `/api/results/publish` | Bearer JWT | Organizer / Admin | Publish or stage event results (`DRAFT`, `REVIEW`, `PUBLISHED`) |
| `POST` | `/api/remarks` | Bearer JWT | Team Member | Submit remark/dispute on published results |
| `GET` | `/api/remarks` | Bearer JWT | Authenticated | List submitted remarks for event |
| `PATCH`| `/api/remarks/:id/resolve` | Bearer JWT | Organizer / Admin | Resolve participant remark with notes |

---

## 19. Sponsors, Analytics, Retention & Notifications
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/events/:id/sponsors` | Optional | Any | List sponsors for event |
| `POST` | `/api/events/:id/sponsors` | Bearer JWT | Organizer / Admin | Add sponsor with logo banner & link |
| `GET` | `/api/events/:id/analytics` | Bearer JWT | Organizer / Sponsor| Aggregate metrics (check-ins, teams, meal counts) |
| `POST` | `/api/events/:id/export` | Bearer JWT | Organizer / Admin | Generate full event JSON/CSV data export |
| `POST` | `/api/events/:id/retention/cleanup` | Bearer JWT | Admin / Super Admin| Execute data retention purge |
| `GET` | `/api/events/:id/retention/receipt`| Public | Any | Download verifiable cryptographic deletion receipt |
| `GET` | `/api/notifications` | Bearer JWT | Authenticated | Get current user's in-app notification inbox |
| `GET` | `/api/notifications/unread-count`| Bearer JWT | Authenticated | Get count of unread notifications |
| `PATCH`| `/api/notifications/:id/read` | Bearer JWT | Authenticated | Mark notification as read |
| `PATCH`| `/api/notifications/read-all` | Bearer JWT | Authenticated | Mark all notifications as read |
