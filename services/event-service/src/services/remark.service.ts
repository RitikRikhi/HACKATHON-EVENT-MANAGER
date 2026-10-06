import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  logAudit,
} from '@event-os/config';
import { Remark, RemarkStatus, UserRole } from '@event-os/types';
import { remarkRepository } from '../repositories/remark.repository';
import { eventRepository } from '../repositories/event.repository';
import { supabase } from '@event-os/config';

export class RemarkService {
  public async createRemark(
    eventId: string,
    teamId: string,
    title: string,
    description: string,
    userId: string
  ): Promise<Remark> {
    if (!title || !description) {
      throw new BadRequestError('title and description are required.');
    }

    // Verify user is part of the team
    const { data: member } = await supabase.client
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!member) {
      throw new ForbiddenError('You must be a member of the team to raise a remark.');
    }

    const remark = await remarkRepository.createRemark({
      event_id: eventId,
      team_id: teamId,
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
    });

    await logAudit(eventId, userId, 'REMARK_RAISED', { remarkId: remark.id, teamId, title });
    return remark;
  }

  public async listRemarks(eventId: string, userId: string, userRole: UserRole): Promise<Remark[]> {
    return await remarkRepository.listRemarksByEvent(eventId);
  }

  public async resolveRemark(
    remarkId: string,
    status: RemarkStatus,
    resolutionNotes: string | undefined,
    userId: string,
    userRole: UserRole
  ): Promise<Remark> {
    const remark = await remarkRepository.findById(remarkId);
    if (!remark) {
      throw new NotFoundError(`Remark with ID ${remarkId} not found.`);
    }

    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const roles = await eventRepository.checkMemberRole(remark.event_id, userId);
    const isOrganizer = isElevated || roles.includes('ORGANIZER') || roles.includes('ADMIN');

    if (!isOrganizer) {
      throw new ForbiddenError('Only event organizers can resolve or review remarks.');
    }

    const resolved = await remarkRepository.updateRemarkStatus(remarkId, status, resolutionNotes, userId);
    await logAudit(remark.event_id, userId, 'REMARK_RESOLVED', {
      remarkId,
      status,
      resolutionNotes,
    });

    return resolved;
  }
}

export const remarkService = new RemarkService();
