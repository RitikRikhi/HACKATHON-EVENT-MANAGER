"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemarkStatus = exports.ResultStatus = exports.ConnectionStatus = exports.HelpdeskStatus = exports.HelpdeskCategory = exports.ScanType = exports.NotificationType = exports.AnnouncementPriority = exports.TicketStatus = exports.JoinRequestStatus = exports.JoinRequestType = exports.TeamStatus = exports.TeamRole = exports.EventStatus = exports.EventType = exports.EventMemberRole = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["PARTICIPANT"] = "PARTICIPANT";
    UserRole["TEAM_LEAD"] = "TEAM_LEAD";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var EventMemberRole;
(function (EventMemberRole) {
    EventMemberRole["ADMIN"] = "ADMIN";
    EventMemberRole["ORGANIZER"] = "ORGANIZER";
    EventMemberRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    EventMemberRole["VOLUNTEER"] = "VOLUNTEER";
    EventMemberRole["MENTOR"] = "MENTOR";
    EventMemberRole["JUDGE"] = "JUDGE";
    EventMemberRole["STAFF"] = "STAFF";
})(EventMemberRole || (exports.EventMemberRole = EventMemberRole = {}));
var EventType;
(function (EventType) {
    EventType["HACKATHON"] = "HACKATHON";
    EventType["COMPETITION"] = "COMPETITION";
    EventType["FEST"] = "FEST";
    EventType["CONFERENCE"] = "CONFERENCE";
    EventType["WORKSHOP"] = "WORKSHOP";
    EventType["SEMINAR"] = "SEMINAR";
    EventType["OTHER"] = "OTHER";
})(EventType || (exports.EventType = EventType = {}));
var EventStatus;
(function (EventStatus) {
    EventStatus["DRAFT"] = "DRAFT";
    EventStatus["PUBLISHED"] = "PUBLISHED";
    EventStatus["UPCOMING"] = "UPCOMING";
    EventStatus["ONGOING"] = "ONGOING";
    EventStatus["COMPLETED"] = "COMPLETED";
    EventStatus["CANCELLED"] = "CANCELLED";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var TeamRole;
(function (TeamRole) {
    TeamRole["TEAM_LEAD"] = "TEAM_LEAD";
    TeamRole["MEMBER"] = "MEMBER";
    TeamRole["VOLUNTEER"] = "VOLUNTEER";
})(TeamRole || (exports.TeamRole = TeamRole = {}));
var TeamStatus;
(function (TeamStatus) {
    TeamStatus["ACTIVE"] = "ACTIVE";
    TeamStatus["COMPLETED"] = "COMPLETED";
    TeamStatus["DISBANDED"] = "DISBANDED";
})(TeamStatus || (exports.TeamStatus = TeamStatus = {}));
var JoinRequestType;
(function (JoinRequestType) {
    JoinRequestType["CODE"] = "CODE";
    JoinRequestType["LINK"] = "LINK";
})(JoinRequestType || (exports.JoinRequestType = JoinRequestType = {}));
var JoinRequestStatus;
(function (JoinRequestStatus) {
    JoinRequestStatus["PENDING"] = "PENDING";
    JoinRequestStatus["ACCEPTED"] = "ACCEPTED";
    JoinRequestStatus["REJECTED"] = "REJECTED";
    JoinRequestStatus["EXPIRED"] = "EXPIRED";
    JoinRequestStatus["CANCELLED"] = "CANCELLED";
})(JoinRequestStatus || (exports.JoinRequestStatus = JoinRequestStatus = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["ACTIVE"] = "ACTIVE";
    TicketStatus["USED"] = "USED";
    TicketStatus["CANCELLED"] = "CANCELLED";
    TicketStatus["EXPIRED"] = "EXPIRED";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var AnnouncementPriority;
(function (AnnouncementPriority) {
    AnnouncementPriority["LOW"] = "LOW";
    AnnouncementPriority["NORMAL"] = "NORMAL";
    AnnouncementPriority["HIGH"] = "HIGH";
    AnnouncementPriority["URGENT"] = "URGENT";
    AnnouncementPriority["CRITICAL"] = "CRITICAL";
})(AnnouncementPriority || (exports.AnnouncementPriority = AnnouncementPriority = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "INFO";
    NotificationType["ALERT"] = "ALERT";
    NotificationType["TICKET"] = "TICKET";
    NotificationType["EVENT_UPDATE"] = "EVENT_UPDATE";
    NotificationType["TEAM"] = "TEAM";
    NotificationType["CHECKIN"] = "CHECKIN";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var ScanType;
(function (ScanType) {
    ScanType["CHECKIN"] = "CHECKIN";
    ScanType["LUNCH"] = "LUNCH";
    ScanType["DINNER"] = "DINNER";
    ScanType["SWAG"] = "SWAG";
})(ScanType || (exports.ScanType = ScanType = {}));
var HelpdeskCategory;
(function (HelpdeskCategory) {
    HelpdeskCategory["MENTOR"] = "MENTOR";
    HelpdeskCategory["TECHNICAL"] = "TECHNICAL";
    HelpdeskCategory["FOOD"] = "FOOD";
    HelpdeskCategory["FACILITIES"] = "FACILITIES";
    HelpdeskCategory["WIFI"] = "WIFI";
    HelpdeskCategory["SAFETY"] = "SAFETY";
    HelpdeskCategory["HARASSMENT"] = "HARASSMENT";
})(HelpdeskCategory || (exports.HelpdeskCategory = HelpdeskCategory = {}));
var HelpdeskStatus;
(function (HelpdeskStatus) {
    HelpdeskStatus["OPEN"] = "OPEN";
    HelpdeskStatus["ASSIGNED"] = "ASSIGNED";
    HelpdeskStatus["RESOLVED"] = "RESOLVED";
    HelpdeskStatus["CANCELLED"] = "CANCELLED";
})(HelpdeskStatus || (exports.HelpdeskStatus = HelpdeskStatus = {}));
var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["PENDING"] = "PENDING";
    ConnectionStatus["ACCEPTED"] = "ACCEPTED";
    ConnectionStatus["REJECTED"] = "REJECTED";
    ConnectionStatus["BLOCKED"] = "BLOCKED";
})(ConnectionStatus || (exports.ConnectionStatus = ConnectionStatus = {}));
var ResultStatus;
(function (ResultStatus) {
    ResultStatus["DRAFT"] = "DRAFT";
    ResultStatus["REVIEW"] = "REVIEW";
    ResultStatus["PUBLISHED"] = "PUBLISHED";
})(ResultStatus || (exports.ResultStatus = ResultStatus = {}));
var RemarkStatus;
(function (RemarkStatus) {
    RemarkStatus["PENDING"] = "PENDING";
    RemarkStatus["ACCEPTED"] = "ACCEPTED";
    RemarkStatus["REJECTED"] = "REJECTED";
    RemarkStatus["RESOLVED"] = "RESOLVED";
})(RemarkStatus || (exports.RemarkStatus = RemarkStatus = {}));
//# sourceMappingURL=index.js.map