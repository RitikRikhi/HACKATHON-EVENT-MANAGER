# 🔐 Auth Service

The **Auth Service** manages user identity, account registration, secure password hashing, JWT token issuance, profile updates, and Nodemailer email notifications.

---

## 🎯 Key Responsibilities
- User account creation (`POST /api/auth/register`)
- User authentication & JWT generation (`POST /api/auth/login`)
- Profile retrieval & updates (`GET /api/auth/me`, `PUT /api/auth/profile`)
- Password change with bcrypt hashing (`PUT /api/auth/change-password`)
- Admin user management & Super Admin role delegation (`GET /api/auth/users`, `PATCH /api/auth/users/:id/role`)
- Sending transactional welcome and login alert emails via SMTP (Nodemailer)

---

## 🔌 Service Port
- **Port:** `8001` (Configurable via `PORT_AUTH`)
- **Internal / Direct URL:** `http://localhost:8001`
- **Gateway Route:** `/api/auth/*`

---

## 🗄️ Database Tables
- `users`: Core user accounts with `id` (UUID), `name`, `email` (UNIQUE), `password_hash`, `role`, `phone`, `profile_image`, `created_at`, `updated_at`.

---

## ⚙️ Environment Variables
| Variable | Description |
| :--- | :--- |
| `PORT_AUTH` | Service port (default: 8001) |
| `JWT_SECRET` | Secret key used to sign JWTs |
| `JWT_EXPIRES_IN` | Token expiration time (default: `7d`) |
| `SUPABASE_URL` | Supabase API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase elevated Service Role Key |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | SMTP configuration for email delivery |
| `EMAIL_FROM` | Default sender display name and email |

---

## 🩺 Health Check
- `GET /health` -> `{ "success": true, "data": { "status": "healthy", "service": "auth-service" } }`
