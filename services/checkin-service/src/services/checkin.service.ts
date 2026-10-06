import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  verifyQRPayload,
  logAudit,
} from '@event-os/config';
import {
  CheckIn,
  ProcessCheckInDTO,
  Ticket,
  TicketStatus,
  NotificationType,
  PaginatedResponse,
  ScanType,
  ScanLog,
  SyncOfflineScansDTO,
  ManualRosterReconcileDTO,
} from '@event-os/types';
import { checkinRepository } from '../repositories/checkin.repository';
import { config } from '../config';

export class CheckinService {
  /**
   * Process QR Check-In / Scan (CHECKIN, LUNCH, DINNER, SWAG)
   */
  public async processCheckIn(dto: ProcessCheckInDTO, checkedInBy: string, scanType: ScanType = ScanType.CHECKIN): Promise<any> {
    let participantId: string | null = null;
    let eventId = dto.eventId;

    // 1. Verify QR string if provided
    if (dto.qrString) {
      const qrResult = verifyQRPayload(dto.qrString, dto.eventId);
      if (!qrResult.valid) {
        throw new BadRequestError(qrResult.error || 'Invalid QR code.');
      }
      participantId = qrResult.participantId!;
      eventId = qrResult.eventId!;
    }

    // 2. Fallback to ticket lookup if ticketCode or ticketId is passed
    let ticket: Ticket | null = null;
    if (!participantId && (dto.ticketId || dto.ticketCode)) {
      const identifier = dto.ticketId || dto.ticketCode;
      ticket = await this.fetchTicket(identifier!);
      if (!ticket) {
        throw new NotFoundError(`Ticket "${identifier}" not found.`);
      }
      if (ticket.event_id !== dto.eventId) {
        throw new BadRequestError(`Ticket event mismatch: Ticket is for ${ticket.event_id}, requested ${dto.eventId}.`);
      }
      participantId = ticket.user_id;
    }

    if (!participantId) {
      throw new BadRequestError('Either valid QR payload or Ticket identifier is required.');
    }

    // 3. Verify Participant is registered for this event
    const registration = await checkinRepository.findRegistration(eventId, participantId);
    if (!registration) {
      throw new NotFoundError('Participant registration not found for this event.');
    }
    if (registration.status === 'CANCELLED') {
      throw new BadRequestError('Participant registration is cancelled.');
    }

    // 4. Duplicate scan verification based on Scan Type
    const existingScan = await checkinRepository.findScanLog(eventId, participantId, scanType);
    if (existingScan) {
      if (scanType === ScanType.CHECKIN) {
        throw new ConflictError(`Participant already checked in at ${existingScan.scanned_at}.`);
      } else if (scanType === ScanType.LUNCH) {
        throw new ConflictError(`Lunch already claimed for this participant at ${existingScan.scanned_at}.`);
      } else if (scanType === ScanType.DINNER) {
        throw new ConflictError(`Dinner already claimed for this participant at ${existingScan.scanned_at}.`);
      } else if (scanType === ScanType.SWAG) {
        throw new ConflictError(`Swag item already claimed for this participant at ${existingScan.scanned_at}.`);
      }
    }

    // 5. Create scan log record (idempotent)
    const scanLog = await checkinRepository.createScanLog({
      event_id: eventId,
      participant_id: participantId,
      type: scanType,
      scanned_by: checkedInBy,
      idempotency_key: dto.idempotencyKey,
    });

    // 6. Handle CHECKIN specific actions
    let seatInfo: { roomName?: string; seatLabel?: string } = {};
    if (scanType === ScanType.CHECKIN) {
      await checkinRepository.createCheckin({
        event_id: eventId,
        ticket_id: ticket?.id || null,
        user_id: participantId,
        checked_in_by: checkedInBy,
        status: 'SUCCESS',
        notes: dto.notes,
      });

      if (ticket?.id) {
        await this.markTicketUsed(ticket.id);
      }

      // Seat reveal
      seatInfo = await checkinRepository.resolveParticipantSeatInfo(eventId, participantId);

      await logAudit(eventId, checkedInBy, 'PARTICIPANT_CHECKIN_SUCCESS', {
        participantId,
        room: seatInfo.roomName,
        seat: seatInfo.seatLabel,
      });

      this.dispatchNotification(participantId, {
        title: 'Check-in Confirmed',
        message: `Welcome! Your check-in is complete.${seatInfo.roomName ? ` Room: ${seatInfo.roomName}, Seat: ${seatInfo.seatLabel}` : ''}`,
        type: NotificationType.CHECKIN,
        metadata: { eventId, seatInfo },
      });
    } else {
      await logAudit(eventId, checkedInBy, `SCAN_${scanType}_CLAIMED`, { participantId });
    }

    return {
      success: true,
      scanType,
      participantId,
      eventId,
      scannedAt: scanLog.scanned_at,
      seatInfo: scanType === ScanType.CHECKIN ? seatInfo : undefined,
    };
  }

  /**
   * Offline Scans Sync
   */
  public async syncOfflineScans(dto: SyncOfflineScansDTO, syncedBy: string): Promise<{ synced: number; failed: number; errors: any[] }> {
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const scan of dto.scans) {
      try {
        await this.processCheckIn(
          {
            qrString: scan.qrString,
            eventId: scan.eventId || dto.eventId,
            idempotencyKey: scan.idempotencyKey,
          },
          syncedBy,
          scan.type || ScanType.CHECKIN
        );
        synced++;
      } catch (err: any) {
        // If already claimed/checked-in via idempotency, count as synced or skip gracefully
        if (err.statusCode === 409) {
          synced++;
        } else {
          failed++;
          errors.push({
            idempotencyKey: scan.idempotencyKey,
            error: err.message,
          });
        }
      }
    }

    await logAudit(dto.eventId, syncedBy, 'OFFLINE_SCANS_SYNCED', { synced, failed });

    return { synced, failed, errors };
  }

  /**
   * Printed Roster Fallback Reconciliation
   */
  public async reconcilePrintedRoster(dto: ManualRosterReconcileDTO, reconciledBy: string): Promise<{ reconciledCount: number; errors: any[] }> {
    let reconciledCount = 0;
    const errors: any[] = [];
    const scanType = dto.type || ScanType.CHECKIN;

    for (const participantId of dto.participantIds) {
      try {
        const existing = await checkinRepository.findScanLog(dto.eventId, participantId, scanType);
        if (!existing) {
          await checkinRepository.createScanLog({
            event_id: dto.eventId,
            participant_id: participantId,
            type: scanType,
            scanned_by: reconciledBy,
          });

          if (scanType === ScanType.CHECKIN) {
            await checkinRepository.createCheckin({
              event_id: dto.eventId,
              user_id: participantId,
              checked_in_by: reconciledBy,
              notes: 'Manual printed roster reconciliation',
            });
          }
          reconciledCount++;
        }
      } catch (err: any) {
        errors.push({ participantId, error: err.message });
      }
    }

    await logAudit(dto.eventId, reconciledBy, 'PRINTED_ROSTER_RECONCILED', { reconciledCount });

    return { reconciledCount, errors };
  }

  public async getEventOfflineRoster(eventId: string): Promise<any[]> {
    return await checkinRepository.getEventOfflineRoster(eventId);
  }

  public async listScanLogs(eventId: string, type?: ScanType): Promise<ScanLog[]> {
    return await checkinRepository.listScanLogs(eventId, type);
  }

  public async getEventAttendance(
    eventId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<CheckIn>> {
    const offset = (page - 1) * limit;
    const { checkins, total } = await checkinRepository.listByEvent(eventId, limit, offset);

    return {
      items: checkins,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async getEventStats(eventId: string): Promise<{ eventId: string; totalCheckedIn: number }> {
    const total = await checkinRepository.countByEvent(eventId);
    return {
      eventId,
      totalCheckedIn: total,
    };
  }

  public async getUserCheckins(userId: string): Promise<CheckIn[]> {
    return await checkinRepository.listByUser(userId);
  }

  private async fetchTicket(idOrCode: string): Promise<Ticket | null> {
    try {
      const url = idOrCode.startsWith('TKT-')
        ? `${config.ticketServiceUrl}/tickets/code/${idOrCode}`
        : `${config.ticketServiceUrl}/tickets/${idOrCode}`;

      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      return (data as any)?.data || null;
    } catch (err) {
      console.warn(`[CheckinService] Inter-service call to Ticket Service failed:`, (err as Error).message);
      return null;
    }
  }

  private async markTicketUsed(ticketId: string): Promise<void> {
    try {
      await fetch(`${config.ticketServiceUrl}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: TicketStatus.USED }),
      });
    } catch (err) {
      console.warn(`[CheckinService] Failed to mark ticket ${ticketId} as used:`, (err as Error).message);
    }
  }

  private async dispatchNotification(userId: string, payload: {
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      if (!config.notificationServiceUrl) return;

      await fetch(`${config.notificationServiceUrl}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          metadata: payload.metadata,
        }),
      });
    } catch (err) {
      console.warn('[CheckinService] Failed to dispatch notification:', (err as Error).message);
    }
  }
}

export const checkinService = new CheckinService();
