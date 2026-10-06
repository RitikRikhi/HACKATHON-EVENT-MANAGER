import { supabase, AppError } from '@event-os/config';
import { Remark, RemarkStatus } from '@event-os/types';

export class RemarkRepository {
  private tableName = 'remarks';

  public async createRemark(data: {
    event_id: string;
    team_id: string;
    user_id: string;
    title: string;
    description: string;
  }): Promise<Remark> {
    const { data: result, error } = await supabase.client
      .from(this.tableName)
      .insert({
        event_id: data.event_id,
        team_id: data.team_id,
        user_id: data.user_id,
        title: data.title,
        description: data.description,
        status: RemarkStatus.PENDING,
      })
      .select(`
        *,
        team:team_id (id, name),
        user:user_id (id, name, email)
      `)
      .single();

    if (error) {
      throw new AppError(`Database error creating remark: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return result as Remark;
  }

  public async listRemarksByEvent(eventId: string): Promise<Remark[]> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select(`
        *,
        team:team_id (id, name),
        user:user_id (id, name, email)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing remarks: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as Remark[]) || [];
  }

  public async findById(id: string): Promise<Remark | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select(`
        *,
        team:team_id (id, name),
        user:user_id (id, name, email)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding remark: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Remark | null;
  }

  public async updateRemarkStatus(
    id: string,
    status: RemarkStatus,
    resolutionNotes: string | undefined,
    reviewedBy: string
  ): Promise<Remark> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .update({
        status,
        resolution_notes: resolutionNotes || null,
        reviewed_by: reviewedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        team:team_id (id, name),
        user:user_id (id, name, email)
      `)
      .single();

    if (error) {
      throw new AppError(`Database error resolving remark: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Remark;
  }
}

export const remarkRepository = new RemarkRepository();
