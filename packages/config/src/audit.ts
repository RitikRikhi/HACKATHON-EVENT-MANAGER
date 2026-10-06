import { supabase } from './supabase';

export const logAudit = async (
  eventId: string,
  actorId: string | null | undefined,
  action: string,
  details: Record<string, unknown> = {}
): Promise<void> => {
  try {
    // Strip sensitive fields if present
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.password_hash;
    delete sanitizedDetails.token;
    delete sanitizedDetails.secret;

    await supabase.client.from('audit_logs').insert({
      event_id: eventId,
      actor_id: actorId || null,
      action,
      details: sanitizedDetails,
    });
  } catch (err) {
    console.warn(`[AuditLog Error] Failed to record audit log for action "${action}":`, (err as Error).message);
  }
};
