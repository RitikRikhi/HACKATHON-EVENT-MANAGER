# 🧪 Testing & Verification Guide — Event OS

Event OS employs a multi-tiered testing strategy spanning unit tests, integration test suites, and Postman API contract verification.

---

## 🏗️ 1. Test Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Postman Automated Tests                  │
│       (Full HTTP request assertions, token capture)         │
├─────────────────────────────────────────────────────────────┤
│                    End-to-End Test Runner                   │
│             (scripts/e2e-test.ts against Gateway)           │
├─────────────────────────────────────────────────────────────┤
│                  Domain Integration Suites                  │
│       (test-phase1-auth, test-phase2-events, etc.)          │
├─────────────────────────────────────────────────────────────┤
│                 In-Memory Unit Test Runner                  │
│    (scripts/test-unit.ts - Cryptography, QR, Contracts)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 2. Running Test Suites

### A. Fast In-Memory Unit Tests (Zero External Dependencies)
Runs in CI and pre-commit checks:
```bash
npm run test:unit
```
Verifies:
- JWT signing, expiration calculation, claim preservation, and tamper detection.
- HMAC-SHA256 QR payload generation and signature verification.
- HTTP status code mappings and domain enums.

### B. End-to-End Live Integration Tests
Runs against active local or staging services (`npm run dev`):
```bash
npm run test:e2e
```
Simulates:
1. User registration & JWT issuance.
2. Event creation, capacity limits, and publishing.
3. Team creation, join codes, and invite links.
4. Ticket booking & HMAC QR generation.
5. Check-in scanning & duplicate scan rejection.
6. Announcements broadcast & in-app notification reception.

### C. Postman Collection Tests
Import `postman/Event_OS_API.postman_collection.json` and `postman/Event_OS_Local.postman_environment.json` into Postman or Newman:
```bash
npx newman run postman/Event_OS_API.postman_collection.json -e postman/Event_OS_Local.postman_environment.json
```
