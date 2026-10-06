import { supabase, AppError } from '@event-os/config';
import { UploadRecord } from '@event-os/types';

export class UploadRepository {
  private tableName = 'uploads';

  public async createUploadRecord(data: {
    event_id: string;
    user_id: string;
    file_name: string;
    original_name: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    category: string;
  }): Promise<UploadRecord> {
    const { data: result, error } = await supabase.client
      .from(this.tableName)
      .insert(data)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error recording upload: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return result as UploadRecord;
  }

  public async findById(id: string): Promise<UploadRecord | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding upload: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as UploadRecord | null;
  }

  public async listByEvent(eventId: string, category?: string): Promise<UploadRecord[]> {
    let query = supabase.client
      .from(this.tableName)
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      throw new AppError(`Database error listing uploads: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as UploadRecord[]) || [];
  }
}

export const uploadRepository = new UploadRepository();
