import { supabase, AppError } from '@event-os/config';
import { Submission } from '@event-os/types';

export class SubmissionRepository {
  private tableName = 'submissions';

  public async findByTeamAndEvent(eventId: string, teamId: string): Promise<Submission | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select(`
        *,
        team:team_id (id, name, track_id, team_code)
      `)
      .eq('event_id', eventId)
      .eq('team_id', teamId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding submission: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Submission | null;
  }

  public async findById(id: string): Promise<Submission | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select(`
        *,
        team:team_id (id, name, track_id, team_code)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding submission by ID: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Submission | null;
  }

  public async listByEvent(eventId: string): Promise<Submission[]> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select(`
        *,
        team:team_id (id, name, track_id, team_code)
      `)
      .eq('event_id', eventId)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing event submissions: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as Submission[]) || [];
  }

  public async createOrUpdate(data: {
    event_id: string;
    team_id: string;
    repo_url: string;
    demo_url?: string | null;
    description?: string | null;
    file_url?: string | null;
    is_locked?: boolean;
  }): Promise<Submission> {
    const existing = await this.findByTeamAndEvent(data.event_id, data.team_id);

    const payload: Record<string, unknown> = {
      event_id: data.event_id,
      team_id: data.team_id,
      repo_url: data.repo_url,
      demo_url: data.demo_url || null,
      description: data.description || null,
      file_url: data.file_url || null,
      is_locked: data.is_locked || false,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { data: updated, error } = await supabase.client
        .from(this.tableName)
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) {
        throw new AppError(`Database error updating submission: ${error.message}`, 500, 'DB_ERROR', error);
      }

      return updated as Submission;
    }

    const { data: created, error } = await supabase.client
      .from(this.tableName)
      .insert({
        ...payload,
        submitted_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating submission: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return created as Submission;
  }
}

export const submissionRepository = new SubmissionRepository();
