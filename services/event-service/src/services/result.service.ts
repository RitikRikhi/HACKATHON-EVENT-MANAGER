import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  logAudit,
} from '@event-os/config';
import { Score, Result, ResultStatus, SubmitScoreDTO, UserRole } from '@event-os/types';
import { resultRepository } from '../repositories/result.repository';
import { eventRepository } from '../repositories/event.repository';

export class ResultService {
  // ---------------------------------------------------------------------------
  // JUDGING & SCORES
  // ---------------------------------------------------------------------------

  public async submitScore(
    eventId: string,
    dto: SubmitScoreDTO,
    userId: string,
    userRole: UserRole
  ): Promise<Score> {
    // 1. Verify Judge authorization
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const roles = await eventRepository.checkMemberRole(eventId, userId);
    const isAuthorizedJudge = isElevated || roles.includes('JUDGE') || roles.includes('ORGANIZER') || roles.includes('ADMIN');

    if (!isAuthorizedJudge) {
      throw new ForbiddenError('You are not authorized as a judge for this event.');
    }

    if (!dto.criteria || typeof dto.criteria !== 'object' || Object.keys(dto.criteria).length === 0) {
      throw new BadRequestError('Scoring criteria must be a valid key-value mapping of criteria scores.');
    }

    // 2. Calculate total
    let total = 0;
    for (const [key, val] of Object.entries(dto.criteria)) {
      const numVal = Number(val);
      if (isNaN(numVal) || numVal < 0) {
        throw new BadRequestError(`Invalid score value for criterion "${key}".`);
      }
      total += numVal;
    }

    const score = await resultRepository.createOrUpdateScore({
      event_id: eventId,
      team_id: dto.teamId,
      judge_id: userId,
      criteria: dto.criteria,
      total,
      feedback: dto.feedback,
    });

    await logAudit(eventId, userId, 'JUDGE_SUBMITTED_SCORE', {
      teamId: dto.teamId,
      total,
      criteria: dto.criteria,
    });

    return score;
  }

  public async listEventScores(eventId: string, userId: string, userRole: UserRole): Promise<Score[]> {
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const roles = await eventRepository.checkMemberRole(eventId, userId);
    const isAuthorized = isElevated || roles.includes('JUDGE') || roles.includes('ORGANIZER');

    if (!isAuthorized) {
      throw new ForbiddenError('Only judges and organizers can view raw judging scores.');
    }

    return await resultRepository.listScoresByEvent(eventId);
  }

  // ---------------------------------------------------------------------------
  // RESULTS PUBLISHING
  // ---------------------------------------------------------------------------

  public async getEventResult(eventId: string, userId?: string, userRole?: UserRole): Promise<Result> {
    const result = await resultRepository.getEventResult(eventId);
    if (!result) {
      throw new NotFoundError('Results have not been created or published for this event yet.');
    }

    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    let isOrganizer = false;
    if (userId) {
      const roles = await eventRepository.checkMemberRole(eventId, userId);
      isOrganizer = roles.includes('ORGANIZER') || roles.includes('ADMIN');
    }

    // Participants MUST NOT see unpublished results
    if (result.status !== ResultStatus.PUBLISHED && !isElevated && !isOrganizer) {
      throw new ForbiddenError('Results for this event have not been published yet.');
    }

    return result;
  }

  public async saveOrPublishResult(
    eventId: string,
    status: ResultStatus,
    payload: Record<string, unknown>,
    userId: string,
    userRole: UserRole
  ): Promise<Result> {
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const roles = await eventRepository.checkMemberRole(eventId, userId);
    const isOrganizer = isElevated || roles.includes('ORGANIZER') || roles.includes('ADMIN');

    if (!isOrganizer) {
      throw new ForbiddenError('Only event organizers can create or publish results.');
    }

    const result = await resultRepository.saveOrPublishResult({
      event_id: eventId,
      status,
      payload: payload || {},
      created_by: userId,
    });

    await logAudit(eventId, userId, status === ResultStatus.PUBLISHED ? 'RESULTS_PUBLISHED' : 'RESULTS_DRAFT_SAVED', {
      status,
    });

    return result;
  }
}

export const resultService = new ResultService();
