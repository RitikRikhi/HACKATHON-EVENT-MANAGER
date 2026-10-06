import { supabase, AppError } from '@event-os/config';
import { User, UserRole } from '@event-os/types';

export class UserRepository {
  private tableName = 'users';

  public async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding user by email: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as User | null;
  }

  public async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding user by ID: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as User | null;
  }

  public async create(user: {
    name: string;
    email: string;
    password_hash: string;
    role: UserRole;
    phone?: string;
    profile_image?: string;
  }): Promise<User> {
    const insertPayload: Record<string, unknown> = {
      name: user.name,
      email: user.email.toLowerCase(),
      password_hash: user.password_hash,
      role: user.role,
    };

    if (user.phone !== undefined) insertPayload.phone = user.phone;
    if (user.profile_image !== undefined) insertPayload.profile_image = user.profile_image;

    const { data, error } = await supabase.client
      .from(this.tableName)
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating user: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as User;
  }

  public async updateProfile(
    id: string,
    updates: { name?: string; phone?: string | null; profile_image?: string | null }
  ): Promise<User> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.phone !== undefined) updatePayload.phone = updates.phone;
    if (updates.profile_image !== undefined) updatePayload.profile_image = updates.profile_image;

    const { data, error } = await supabase.client
      .from(this.tableName)
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error updating profile: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as User;
  }

  public async updatePassword(id: string, passwordHash: string): Promise<void> {
    const { error } = await supabase.client
      .from(this.tableName)
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new AppError(`Database error updating password: ${error.message}`, 500, 'DB_ERROR', error);
    }
  }

  public async list(limit = 50, offset = 0): Promise<{ users: User[]; total: number }> {
    const { data, error, count } = await supabase.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing users: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return {
      users: (data as User[]) || [],
      total: count || 0,
    };
  }

  public async updateRole(id: string, newRole: UserRole): Promise<User> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error updating user role: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as User;
  }
}

export const userRepository = new UserRepository();
