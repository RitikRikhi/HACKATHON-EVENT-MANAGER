// =============================================================================
// Event OS - Shared TypeScript Types & Enums
// =============================================================================

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------

export enum UserRole {
  USER = 'USER',
  PARTICIPANT = 'PARTICIPANT',
  TEAM_LEAD = 'TEAM_LEAD',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum EventMemberRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  VOLUNTEER = 'VOLUNTEER',
  MENTOR = 'MENTOR',
  JUDGE = 'JUDGE',
  STAFF = 'STAFF',
}

export enum EventType {
  HACKATHON = 'HACKATHON',
  COMPETITION = 'COMPETITION',
  FEST = 'FEST',
  CONFERENCE = 'CONFERENCE',
  WORKSHOP = 'WORKSHOP',
  SEMINAR = 'SEMINAR',
  OTHER = 'OTHER',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TeamRole {
  TEAM_LEAD = 'TEAM_LEAD',
  MEMBER = 'MEMBER',
  VOLUNTEER = 'VOLUNTEER',
}

export enum TeamStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DISBANDED = 'DISBANDED',
}

export enum JoinRequestType {
  CODE = 'CODE',
  LINK = 'LINK',
}

export enum JoinRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum AnnouncementPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export enum NotificationType {
  INFO = 'INFO',
  ALERT = 'ALERT',
  TICKET = 'TICKET',
  EVENT_UPDATE = 'EVENT_UPDATE',
  TEAM = 'TEAM',
  CHECKIN = 'CHECKIN',
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

export enum HelpdeskStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}

export enum ResultStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
}

export enum RemarkStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  RESOLVED = 'RESOLVED',
}

// -----------------------------------------------------------------------------
// AUTH & USER INTERFACES
// -----------------------------------------------------------------------------

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  phone?: string | null;
  profile_image?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  profileImage?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  profileImage?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  profileImage?: string;
}

export interface ChangePasswordDTO {
  oldPassword?: string;
  currentPassword?: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

// -----------------------------------------------------------------------------
// EVENT INTERFACES
// -----------------------------------------------------------------------------

export interface Event {
  id: string;
  name: string;
  description: string | null;
  event_type: EventType;
  venue: string;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  capacity: number;
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  join_code?: string;
  retention_days?: number;
  is_closed?: boolean;
  closed_at?: string | null;
  registered_count?: number;
  is_user_registered?: boolean;
}

export interface EventMember {
  id: string;
  event_id: string;
  user_id: string;
  role: EventMemberRole;
  created_at: string;
  user?: UserDTO;
}

export interface CreateEventDTO {
  name: string;
  description?: string;
  eventType?: EventType;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  capacity: number;
  status?: EventStatus;
  retentionDays?: number;
}

export interface UpdateEventDTO {
  name?: string;
  description?: string;
  eventType?: EventType;
  venue?: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  capacity?: number;
  status?: EventStatus;
  retentionDays?: number;
}

export interface EventFilterQuery {
  eventType?: EventType;
  status?: EventStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  registered_at: string;
  college?: string | null;
  skills?: string[] | null;
  social_links?: Record<string, string>;
  consent_at?: string | null;
  checked_in_at?: string | null;
  looking_for_team?: boolean;
  qr_payload?: string | null;
  user?: UserDTO;
  event?: Event;
}

export interface EventParticipantDTO {
  id: string;
  userId: string;
  eventId: string;
  status: string;
  registeredAt: string;
  college?: string | null;
  skills?: string[] | null;
  socialLinks?: Record<string, string>;
  consentAt?: string | null;
  checkedInAt?: string | null;
  lookingForTeam?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    profileImage?: string | null;
  };
}

export interface RegisterForEventDTO {
  college?: string;
  skills?: string[];
  socialLinks?: Record<string, string>;
  consent: boolean;
  lookingForTeam?: boolean;
}

// -----------------------------------------------------------------------------
// TRACKS, ROOMS & SEATS
// -----------------------------------------------------------------------------

export interface Track {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  event_id: string;
  name: string;
  capacity: number;
  created_at: string;
}

export interface Seat {
  id: string;
  event_id: string;
  room_id: string;
  label: string;
  team_id?: string | null;
  created_at: string;
  room?: Room;
  team?: Team;
}

export interface CreateTrackDTO {
  name: string;
  description?: string;
}

export interface CreateRoomDTO {
  name: string;
  capacity: number;
}

export interface AllocateSeatsDTO {
  strategy?: 'TRACK_LARGEST_FIRST' | 'SEQUENTIAL';
}

export interface ManualSeatAssignmentDTO {
  teamId: string;
  roomId: string;
  seatLabel: string;
}

export interface SeatSwapDTO {
  teamAId: string;
  teamBId: string;
}

// -----------------------------------------------------------------------------
// TEAM INTERFACES
// -----------------------------------------------------------------------------

export interface Team {
  id: string;
  name: string;
  description: string | null;
  event_id: string;
  team_code?: string;
  status?: TeamStatus;
  track_id?: string | null;
  room_id?: string | null;
  seat_label?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  track?: Track;
  room?: Room;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  status?: string;
  joined_at: string;
  user?: UserDTO;
}

export interface TeamJoinRequest {
  id: string;
  team_id: string;
  user_id: string;
  type: JoinRequestType;
  invitation_token?: string | null;
  status: JoinRequestStatus;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: UserDTO;
  team?: Team;
}

export interface TeamInviteLink {
  id: string;
  team_id: string;
  token: string;
  created_by: string;
  max_uses?: number | null;
  used_count: number;
  expires_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamDTO {
  name: string;
  description?: string;
  eventId: string;
  trackId?: string;
}

export interface JoinTeamByCodeDTO {
  teamCode: string;
}

export interface CreateInviteLinkDTO {
  maxUses?: number;
  expiresInHours?: number;
}

export interface TransferLeadershipDTO {
  newLeaderId: string;
}

export interface AddTeamMemberDTO {
  userId: string;
  role?: TeamRole;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

// -----------------------------------------------------------------------------
// TICKET & QR INTERFACES
// -----------------------------------------------------------------------------

export interface Ticket {
  id: string;
  event_id: string;
  user_id: string;
  ticket_code: string;
  status: TicketStatus;
  price: number;
  qr_data: string | null;
  created_at: string;
  updated_at: string;
  event?: Event;
  user?: UserDTO;
}

export interface CreateTicketDTO {
  eventId: string;
  userId?: string;
  price?: number;
}

export interface ValidateTicketResponse {
  valid: boolean;
  message: string;
  ticket?: Ticket;
}

export interface QRPayload {
  participantId: string;
  eventId: string;
  expiry: number;
  version: string;
  signature: string;
}

export interface VerifyQRDTO {
  qrString: string;
  eventId: string;
  type?: ScanType;
  idempotencyKey?: string;
}

export interface OfflineScanRecord {
  qrString: string;
  eventId: string;
  type: ScanType;
  scannedAt: string;
  idempotencyKey: string;
}

export interface SyncOfflineScansDTO {
  eventId: string;
  scans: OfflineScanRecord[];
}

export interface ScanLog {
  id: string;
  event_id: string;
  participant_id: string;
  type: ScanType;
  scanned_by?: string | null;
  scanned_at: string;
  idempotency_key?: string | null;
}

// -----------------------------------------------------------------------------
// CHECK-IN INTERFACES
// -----------------------------------------------------------------------------

export interface CheckIn {
  id: string;
  event_id: string;
  ticket_id: string;
  user_id: string;
  checked_in_by: string | null;
  status: string;
  checked_in_at: string;
  notes: string | null;
  ticket?: Ticket;
  user?: UserDTO;
  seatInfo?: {
    roomName?: string;
    seatLabel?: string;
  };
}

export interface ProcessCheckInDTO {
  ticketCode?: string;
  ticketId?: string;
  qrString?: string;
  eventId: string;
  notes?: string;
  idempotencyKey?: string;
}

export interface ManualRosterReconcileDTO {
  eventId: string;
  participantIds: string[];
  type?: ScanType;
}

// -----------------------------------------------------------------------------
// ANNOUNCEMENT INTERFACES
// -----------------------------------------------------------------------------

export interface Announcement {
  id: string;
  event_id: string | null;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  pinned?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: UserDTO;
}

export interface CreateAnnouncementDTO {
  eventId?: string;
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  pinned?: boolean;
}

export interface UpdateAnnouncementDTO {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  pinned?: boolean;
}

// -----------------------------------------------------------------------------
// COMMUNITY CHAT INTERFACES
// -----------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  event_id: string;
  channel: string;
  participant_id: string;
  body: string;
  deleted_at?: string | null;
  created_at: string;
  participant?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface CreateChatMessageDTO {
  channel?: string;
  body: string;
}

export interface MuteUserDTO {
  userId: string;
  durationMinutes: number;
  reason?: string;
}

// -----------------------------------------------------------------------------
// QUESTIONS / Q&A INTERFACES
// -----------------------------------------------------------------------------

export interface Question {
  id: string;
  event_id: string;
  participant_id: string;
  body: string;
  answered: boolean;
  answer?: string | null;
  answered_by?: string | null;
  upvotes: number;
  created_at: string;
  participant?: {
    id: string;
    name: string;
  };
  hasUpvoted?: boolean;
}

export interface CreateQuestionDTO {
  body: string;
}

export interface AnswerQuestionDTO {
  answer: string;
}

// -----------------------------------------------------------------------------
// POLLS INTERFACES
// -----------------------------------------------------------------------------

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  vote_count: number;
}

export interface Poll {
  id: string;
  event_id: string;
  question: string;
  status: 'OPEN' | 'CLOSED';
  created_by: string;
  created_at: string;
  options: PollOption[];
  userVotedOptionId?: string | null;
}

export interface CreatePollDTO {
  question: string;
  options: string[];
}

export interface VotePollDTO {
  optionId: string;
}

// -----------------------------------------------------------------------------
// HELPDESK / SUPPORT TICKET INTERFACES
// -----------------------------------------------------------------------------

export interface HelpdeskTicket {
  id: string;
  event_id: string;
  user_id: string;
  team_id?: string | null;
  category: HelpdeskCategory;
  description: string;
  status: HelpdeskStatus;
  assigned_to?: string | null;
  created_at: string;
  assigned_at?: string | null;
  resolved_at?: string | null;
  resolved_notes?: string | null;
  user?: UserDTO;
  team?: Team;
  seatInfo?: {
    roomName?: string;
    seatLabel?: string;
  };
  elapsedMinutes?: number;
}

export interface CreateHelpdeskTicketDTO {
  category: HelpdeskCategory;
  description: string;
}

export interface UpdateHelpdeskTicketDTO {
  status?: HelpdeskStatus;
  assignedTo?: string;
  resolvedNotes?: string;
}

// -----------------------------------------------------------------------------
// TEAM CONNECTIONS INTERFACES
// -----------------------------------------------------------------------------

export interface TeamConnection {
  id: string;
  event_id: string;
  from_team: string;
  to_team: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  fromTeam?: Team;
  toTeam?: Team;
}

export interface CreateConnectionDTO {
  targetTeamId: string;
}

export interface ReportOrBlockTeamDTO {
  targetTeamId: string;
  reason?: string;
}

// -----------------------------------------------------------------------------
// SUBMISSIONS & UPLOADS INTERFACES
// -----------------------------------------------------------------------------

export interface Submission {
  id: string;
  event_id: string;
  team_id: string;
  repo_url: string;
  demo_url?: string | null;
  description?: string | null;
  file_url?: string | null;
  submitted_at: string;
  is_locked: boolean;
  updated_at: string;
  team?: Team;
}

export interface CreateSubmissionDTO {
  repoUrl: string;
  demoUrl?: string;
  description?: string;
  fileUrl?: string;
  lock?: boolean;
}

export interface UploadRecord {
  id: string;
  event_id: string;
  user_id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  category: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// JUDGING, SCORES, RESULTS & REMARKS
// -----------------------------------------------------------------------------

export interface Score {
  id: string;
  event_id: string;
  team_id: string;
  judge_id: string;
  criteria: Record<string, number>;
  total: number;
  feedback?: string | null;
  created_at: string;
  updated_at: string;
  judge?: UserDTO;
  team?: Team;
}

export interface SubmitScoreDTO {
  teamId: string;
  criteria: Record<string, number>;
  feedback?: string;
}

export interface Result {
  id: string;
  event_id: string;
  status: ResultStatus;
  published_at?: string | null;
  payload: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PublishResultDTO {
  status: ResultStatus;
  payload?: Record<string, unknown>;
}

export interface Remark {
  id: string;
  event_id: string;
  team_id: string;
  user_id: string;
  title: string;
  description: string;
  status: RemarkStatus;
  resolution_notes?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
  user?: UserDTO;
  team?: Team;
}

export interface CreateRemarkDTO {
  title: string;
  description: string;
}

export interface ResolveRemarkDTO {
  status: RemarkStatus;
  resolutionNotes?: string;
}

// -----------------------------------------------------------------------------
// SPONSORS & ANALYTICS
// -----------------------------------------------------------------------------

export interface Sponsor {
  id: string;
  event_id: string;
  name: string;
  banner_url?: string | null;
  link?: string | null;
  created_at: string;
}

export interface CreateSponsorDTO {
  name: string;
  bannerUrl?: string;
  link?: string;
}

export interface AggregateAnalytics {
  eventId: string;
  totalParticipants: number;
  totalCheckedIn: number;
  totalTeams: number;
  totalSubmissions: number;
  scansSummary: {
    checkin: number;
    lunch: number;
    dinner: number;
    swag: number;
  };
  trackDistribution: Record<string, number>;
}

// -----------------------------------------------------------------------------
// EXPORT & RETENTION
// -----------------------------------------------------------------------------

export interface DeletionReceipt {
  id: string;
  event_id: string;
  event_name: string;
  deleted_at: string;
  records_deleted: number;
  storage_files_deleted: number;
  receipt_token: string;
}

// -----------------------------------------------------------------------------
// AUDIT LOGS
// -----------------------------------------------------------------------------

export interface AuditLog {
  id: string;
  event_id: string;
  actor_id?: string | null;
  action: string;
  details?: Record<string, unknown>;
  created_at: string;
}

// -----------------------------------------------------------------------------
// NOTIFICATIONS
// -----------------------------------------------------------------------------

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// COMMON API RESPONSE INTERFACES
// -----------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
