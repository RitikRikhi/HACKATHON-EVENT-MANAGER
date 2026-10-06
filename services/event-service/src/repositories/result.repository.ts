import { supabase, AppError } from '@event-os/config';
import { Score, Result, ResultStatus } from '@event-os/types';

export class ResultRepository {
  private scoresTable = 'scores';
  private resultsTable = 'results';

  // ---------------------------------------------------------------------------
  // SCORES (JUDGING)
  // ---------------------------------------------------------------------------

  public async createOrUpdateScore(data: {
    event_id: string;
    team_id: string;
    judge_id: string;
    criteria: Record<string, number>;
    total: number;
    feedback?: string | null;
  }): Promise<Score> {
    const { data: score, error } = await supabase.client
      .from(this.scoresTable)
      .upsert({
        event_id: data.event_id,
        team_id: data.team_id,
        judge_id: data.judge_id,
        criteria: data.criteria,
        total: data.total,
        feedback: data.feedback || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'event_id,team_id,judge_id' })
      .select(`
        *,
        team:team_id (id, name, track_id),
        judge:judge_id (id, name, email)
      `)
      .single();

    if (error) {
      throw new AppError(`Database error submitting score: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return score as Score;
  }

  public async listScoresByEvent(eventId: string): Promise<Score[]> {
    const { data, error } = await supabase.client
      .from(this.scoresTable)
      .select(`
        *,
        team:team_id (id, name, track_id),
        judge:judge_id (id, name, email)
      `)
      .eq('event_id', eventId)
      .order('total', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing scores: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as Score[]) || [];
  }

  public async listScoresByTeam(eventId: string, teamId: string): Promise<Score[]> {
    const { data, error } = await supabase.client
      .from(this.scoresTable)
      .select(`
        *,
        team:team_id (id, name, track_id),
        judge:judge_id (id, name, email)
      `)
      .eq('event_id', eventId)
      .eq('team_id', teamId);

    if (error) {
      throw new AppError(`Database error listing team scores: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as Score[]) || [];
  }

  // ---------------------------------------------------------------------------
  // RESULTS
  // ---------------------------------------------------------------------------

  public async getEventResult(eventId: string): Promise<Result | null> {
    const { data, error } = await supabase.client
      .from(this.resultsTable)
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding results: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Result | null;
  }

  public async saveOrPublishResult(data: {
    event_id: string;
    status: ResultStatus;
    payload: Record<string, unknown>;
    created_by: string;
  }): Promise<Result> {
    const isPublishing = data.status === ResultStatus.PUBLISHED;

    const { data: result, error } = await supabase.client
      .from(this.resultsTable)
      .upsert({
        event_id: data.event_id,
        status: data.status,
        payload: data.payload,
        created_by: data.created_by,
        published_at: isPublishing ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'event_id' })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error saving result: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return result as Result;
  }
}

export const resultRepository = new ResultRepository();
