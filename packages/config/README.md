# ⚙️ @event-os/config

Shared configuration utilities, JWT cryptography, Supabase client initialization, HTTP response helpers, custom error classes, and Express middlewares.

---

## 🔑 Key Modules & Exports
- **`env`**: Environment variable validation and access.
- **`jwt`**: `signToken`, `verifyToken`, `decodeToken` wrappers around `jsonwebtoken`.
- **`qr`**: HMAC-SHA256 signature generation (`generateQRPayload`) and validation (`verifyQRPayload`).
- **`supabase`**: Singleton `@supabase/supabase-js` client configured with `SUPABASE_SERVICE_ROLE_KEY`.
- **`response`**: Standardized JSON envelopes `sendSuccess` and `sendError`.
- **`errors`**: Domain error classes (`AppError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `ValidationError`, `TooManyRequestsError`).
- **`middlewares`**:
  - `authenticate`: JWT bearer authentication middleware.
  - `optionalAuthenticate`: Non-blocking authentication middleware.
  - `authorizeRoles`: Role-based access control (RBAC) middleware.
  - `requestLogger`: Morgan-based scoped console logging.
  - `errorHandler` & `notFoundHandler`: Global standard error handlers.
  - `chatRateLimiter`, `questionRateLimiter`, `ticketRateLimiter`: In-memory IP/user rate limiters.

---

## 🔨 Build
```bash
npm run build --workspace=@event-os/config
```
