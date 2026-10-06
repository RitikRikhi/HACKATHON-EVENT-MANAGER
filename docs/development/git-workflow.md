# 🌿 Git & Pull Request Workflow — Event OS

This document details the branching strategy, commit conventions, and code review standards for the Event OS repository.

---

## 🌳 Branching Strategy

```text
main (Production stable branch - protected)
  ▲
  │ (Pull Request after CI passes)
develop (Active integration branch)
  ▲
  │ (Feature branches)
feature/<feature-name>   (e.g., feature/qr-multi-checkpoint)
fix/<bug-description>    (e.g., fix/checkin-idempotency)
docs/<doc-topic>         (e.g., docs/api-postman-update)
```

---

## 📝 Commit Message Format (Conventional Commits)

Format: `<type>(<scope>): <short summary>`

- `feat(checkin)`: Add meal scanning and idempotency keys
- `fix(auth)`: Prevent password hash exposure on profile update
- `docs(api)`: Document judging scorecard endpoints
- `test(jwt)`: Add cryptographic tamper detection unit tests
- `refactor(gateway)`: Clean proxy header forwarding logic

---

## 📋 Pull Request Requirements
Before submitting a PR:
1. `npm run typecheck` passes with zero errors.
2. `npm run lint` passes with zero errors.
3. `npm run test:unit` passes.
4. Corresponding API documentation in `docs/` is updated.
5. No `.env` files or API secrets are committed.
