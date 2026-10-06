import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  logAudit,
} from '@event-os/config';
import { Submission, CreateSubmissionDTO, UserRole } from '@event-os/types';
import { submissionRepository } from '../repositories/submission.repository';
import { eventRepository } from '../repositories/event.repository';
import { supabase } from '@event-os/config';

export class SubmissionService {
  public async submitProject(
    eventId: string,
    teamId: string,
    dto: CreateSubmissionDTO,
    userId: string,
    userRole: UserRole
  ): Promise<Submission> {
    // 1. Validate Event exists and deadline
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError(`Event with ID ${eventId} not found.`);
    }

    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline).getTime();
      // If deadline has passed and user is not admin
      if (Date.now() > deadline && userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
        throw new BadRequestError('Submission deadline has passed.');
      }
    }

    // 2. Validate user is member of the team
    const { data: member } = await supabase.client
      .from('team_members')
      .select('id, role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();

    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!member && !isElevated) {
      throw new ForbiddenError('You must be a member of the team to submit or modify a project.');
    }

    // 3. Validate URL formats
    if (!this.isValidUrl(dto.repoUrl)) {
      throw new BadRequestError('A valid repository URL is required.');
    }
    if (dto.demoUrl && !this.isValidUrl(dto.demoUrl)) {
      throw new BadRequestError('Demo URL must be a valid URL format.');
    }

    // 4. Check if existing submission is locked
    const existing = await submissionRepository.findByTeamAndEvent(eventId, teamId);
    if (existing && existing.is_locked && !isElevated) {
      throw new BadRequestError('This submission has been finalized and locked. Contact an organizer to unlock.');
    }

    // 5. Create or Update
    const submission = await submissionRepository.createOrUpdate({
      event_id: eventId,
      team_id: teamId,
      repo_url: dto.repoUrl.trim(),
      demo_url: dto.demoUrl?.trim(),
      description: dto.description?.trim(),
      file_url: dto.fileUrl?.trim(),
      is_locked: dto.lock ?? false,
    });

    await logAudit(eventId, userId, 'SUBMISSION_SAVED', {
      teamId,
      isLocked: submission.is_locked,
      repoUrl: submission.repo_url,
    });

    return submission;
  }

  public async getSubmissionByTeam(eventId: string, teamId: string): Promise<Submission> {
    const submission = await submissionRepository.findByTeamAndEvent(eventId, teamId);
    if (!submission) {
      throw new NotFoundError('Submission not found for this team.');
    }
    return submission;
  }

  public async listEventSubmissions(eventId: string): Promise<Submission[]> {
    return await submissionRepository.listByEvent(eventId);
  }

  private isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

export const submissionService = new SubmissionService();
