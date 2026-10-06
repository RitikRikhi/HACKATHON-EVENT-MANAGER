# ⚠️ API Error Handling Reference — Event OS

Event OS employs a strictly unified JSON error envelope across all microservices and the API Gateway.

---

## 📦 Standard Error Response Schema

Every non-2xx HTTP response returns the following JSON structure:

```json
{
  "success": false,
  "message": "Human readable explanation of what went wrong",
  "error": "STANDARDIZED_ERROR_CODE",
  "details": {
    "field": "Optional contextual diagnostics"
  }
}
```

---

## 🛑 Common HTTP Status Codes

| HTTP Status | Error Code | Common Causes | Frontend Action Required |
| :--- | :--- | :--- | :--- |
| **`400 Bad Request`** | `VALIDATION_ERROR`, `BAD_REQUEST` | Missing required fields, invalid email format, weak password, invalid date order | Show inline form field validation errors to the user. Do not redirect. |
| **`401 Unauthorized`** | `UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_TOKEN` | Missing `Authorization` header, invalid JWT signature, expired token, incorrect login password | Prompt user to log in or refresh token. Clear stored JWT from local storage / state. |
| **`403 Forbidden`** | `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS` | User role lacks permission (e.g. `PARTICIPANT` accessing admin routes, non-lead updating team) | Display permission denied message ("You do not have permission to perform this action"). |
| **`404 Not Found`** | `NOT_FOUND` | Event, team, ticket, or user ID does not exist | Display "Resource not found" empty state or redirect to dashboard. |
| **`409 Conflict`** | `CONFLICT`, `ALREADY_EXISTS`, `CAPACITY_EXCEEDED` | Email already registered, user already registered for event, team name duplicate, duplicate QR scan | Display specific conflict message (e.g. "You are already registered for this event"). |
| **`429 Too Many Requests`** | `RATE_LIMIT_EXCEEDED` | Participant exceeded chat/question rate limit (max 5/minute) | Show countdown timer / cooldown notice ("Please wait a few seconds before sending another message"). |
| **`500 Internal Server Error`** | `INTERNAL_SERVER_ERROR` | Database connection error, unexpected exception | Show toast: "Server error occurred. Please try again later." Log error details. |
| **`503 Service Unavailable`** | `SERVICE_UNAVAILABLE` | Downstream microservice is offline or restarting | Gateway proxy fallback: retry request with exponential backoff. |

---

## 💻 Frontend Error Handling Example (TypeScript)

```typescript
import axios, { AxiosError } from 'axios';

interface ApiErrorPayload {
  success: false;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

export async function handleApiRequest<T>(requestFn: () => Promise<{ data: { success: boolean; data: T } }>): Promise<T> {
  try {
    const response = await requestFn();
    return response.data.data;
  } catch (err) {
    const axiosError = err as AxiosError<ApiErrorPayload>;
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      const message = data?.message || 'An unexpected error occurred.';
      const errorCode = data?.error || 'UNKNOWN_ERROR';

      if (status === 401) {
        // Clear auth and route to login
        localStorage.removeItem('event_os_token');
        window.location.href = '/login';
      } else if (status === 403) {
        console.warn('Access denied:', message);
      } else if (status === 409) {
        console.info('Resource conflict:', message);
      }

      throw new Error(`[${errorCode}] ${message}`);
    }
    throw new Error('Network error or gateway unreachable.');
  }
}
```
