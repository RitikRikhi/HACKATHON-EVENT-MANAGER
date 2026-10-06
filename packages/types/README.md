# 📦 @event-os/types

Shared TypeScript domain interfaces, data transfer objects (DTOs), and enums used across all Event OS microservices, scripts, and frontend integrations.

---

## 🔑 Key Exports
- **Enums:** `UserRole`, `EventMemberRole`, `EventType`, `EventStatus`, `TeamRole`, `TeamStatus`, `JoinRequestType`, `JoinRequestStatus`, `TicketStatus`, `AnnouncementPriority`, `NotificationType`, `ScanType`, `HelpdeskCategory`, `HelpdeskStatus`, `ConnectionStatus`, `ResultStatus`, `RemarkStatus`.
- **DTOs:** `RegisterDTO`, `LoginDTO`, `CreateEventDTO`, `UpdateEventDTO`, `RegisterForEventDTO`, `CreateTeamDTO`, `JoinTeamByCodeDTO`, `CreateInviteLinkDTO`, `VerifyQRDTO`, `SyncOfflineScansDTO`, `CreateAnnouncementDTO`, `CreateChatMessageDTO`, `CreateQuestionDTO`, `CreatePollDTO`, `CreateHelpdeskTicketDTO`, `CreateSubmissionDTO`, `SubmitScoreDTO`, `PublishResultDTO`, `CreateRemarkDTO`, etc.
- **Interfaces:** `User`, `Event`, `Team`, `Ticket`, `CheckIn`, `Announcement`, `HelpdeskTicket`, `Submission`, `Score`, `Result`, `Remark`, `ApiResponse`, `ApiErrorResponse`, `PaginatedResponse`.

---

## 🔨 Build
```bash
npm run build --workspace=@event-os/types
```
