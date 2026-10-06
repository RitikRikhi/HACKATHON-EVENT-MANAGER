# 💬 Workflow: Remarks & Score Dispute System

The Remarks workflow provides a transparent, formal channel for teams to submit feedback, contest judging discrepancies, or request clarification following the publication of results.

---

## 🔄 Lifecycle

```text
[ Team Member ] ──► Submits Remark / Dispute ──► POST /api/remarks
                                                          │
                                                          ▼
                                             [ Status: PENDING ]
                                                          │
                                                          ▼
                                 [ Lead Organizer Reviews with Judge ]
                                                          │
                    ┌─────────────────────────────────────┴─────────────────────────────────────┐
                    ▼                                                                           ▼
           [ Remark Accepted ]                                                         [ Remark Resolved / Rejected ]
           Status: ACCEPTED / RESOLVED                                                 Status: REJECTED / RESOLVED
           Score adjusted & resolution notes posted                                    Clarification notes provided
```

---

## 🛠️ API Reference

### 1. Submit Remark
- **Endpoint:** `POST /api/remarks`
- **Headers:** `Authorization: Bearer <TeamMember_JWT>`
- **Body:**
  ```json
  {
    "title": "Judging Feedback Inquiry on Hardware Requirements",
    "description": "Our team demonstration included physical FPGA hardware which was not noted in the scorecard."
  }
  ```

### 2. Organizer Review & Resolution
- **Endpoint:** `PATCH /api/remarks/:id/resolve`
- **Headers:** `Authorization: Bearer <Admin_JWT>`
- **Body:**
  ```json
  {
    "status": "RESOLVED",
    "resolutionNotes": "Reviewed with Judge Panel. Score scorecard amended by +5 points for hardware novelty."
  }
  ```
