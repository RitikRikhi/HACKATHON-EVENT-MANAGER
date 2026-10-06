import { supabase, AppError } from '@event-os/config';
import {
  Announcement,
  AnnouncementPriority,
  ChatMessage,
  Question,
  Poll,
  PollOption,
} from '@event-os/types';

export class AnnouncementRepository {
  private tableName = 'announcements';
  private chatTable = 'chat_messages';
  private chatMutesTable = 'chat_mutes';
  private questionsTable = 'questions';
  private upvotesTable = 'question_upvotes';
  private pollsTable = 'polls';
  private pollOptionsTable = 'poll_options';
  private pollVotesTable = 'poll_votes';

  // ---------------------------------------------------------------------------
  // ANNOUNCEMENTS
  // ---------------------------------------------------------------------------

  public async createAnnouncement(data: {
    title: string;
    content: string;
    priority: AnnouncementPriority;
    pinned?: boolean;
    event_id?: string;
    created_by: string;
  }): Promise<Announcement> {
    const { data: result, error } = await supabase.client
      .from(this.tableName)
      .insert({
        title: data.title,
        content: data.content,
        priority: data.priority,
        pinned: data.pinned || false,
        event_id: data.event_id || null,
        created_by: data.created_by,
      })
      .select(`
        *,
        creator:created_by (id, name, email, role)
      `)
      .single();

    if (error) {
      throw new AppError(`Database error creating announcement: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return result as Announcement;
  }

  public async findById(id: string): Promise<Announcement | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select(`
        *,
        creator:created_by (id, name, email, role)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding announcement: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Announcement | null;
  }

  public async listAnnouncements(params: {
    eventId?: string;
    priority?: AnnouncementPriority;
    limit?: number;
    offset?: number;
  }): Promise<{ announcements: Announcement[]; total: number }> {
    const { eventId, priority, limit = 20, offset = 0 } = params;

    let query = supabase.client.from(this.tableName).select(
      `
        *,
        creator:created_by (id, name, email, role)
      `,
      { count: 'exact' }
    );

    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing announcements: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return {
      announcements: (data as Announcement[]) || [],
      total: count || 0,
    };
  }

  public async updateAnnouncement(
    id: string,
    updates: Partial<{
      title: string;
      content: string;
      priority: AnnouncementPriority;
      pinned: boolean;
    }>
  ): Promise<Announcement> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        creator:created_by (id, name, email, role)
      `)
      .single();

    if (error) {
      throw new AppError(`Database error updating announcement: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Announcement;
  }

  public async deleteAnnouncement(id: string): Promise<boolean> {
    const { error } = await supabase.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(`Database error deleting announcement: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // COMMUNITY CHAT
  // ---------------------------------------------------------------------------

  public async isUserMutedInChat(eventId: string, userId: string): Promise<boolean> {
    const { data } = await supabase.client
      .from(this.chatMutesTable)
      .select('muted_until')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!data || !data.muted_until) return false;
    return new Date(data.muted_until).getTime() > Date.now();
  }

  public async muteUserInChat(eventId: string, userId: string, durationMinutes: number, reason?: string): Promise<void> {
    const mutedUntil = new Date(Date.now() + durationMinutes * 60000).toISOString();
    await supabase.client
      .from(this.chatMutesTable)
      .upsert({
        event_id: eventId,
        user_id: userId,
        muted_until: mutedUntil,
        reason: reason || null,
      }, { onConflict: 'event_id,user_id' });
  }

  public async createChatMessage(data: {
    event_id: string;
    channel: string;
    participant_id: string;
    body: string;
  }): Promise<ChatMessage> {
    const { data: result, error } = await supabase.client
      .from(this.chatTable)
      .insert({
        event_id: data.event_id,
        channel: data.channel || 'general',
        participant_id: data.participant_id,
        body: data.body,
      })
      .select(`
        id,
        event_id,
        channel,
        participant_id,
        body,
        created_at,
        users:participant_id (id, name, role)
      `)
      .single();

    if (error) {
      throw new AppError(`Database error sending chat message: ${error.message}`, 500, 'DB_ERROR', error);
    }

    const userObj = Array.isArray(result.users) ? result.users[0] : result.users;

    return {
      id: result.id,
      event_id: result.event_id,
      channel: result.channel,
      participant_id: result.participant_id,
      body: result.body,
      created_at: result.created_at,
      participant: userObj,
    } as unknown as ChatMessage;
  }

  public async listChatMessages(
    eventId: string,
    channel = 'general',
    limit = 50,
    offset = 0
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const { data, error, count } = await supabase.client
      .from(this.chatTable)
      .select(`
        id,
        event_id,
        channel,
        participant_id,
        body,
        created_at,
        users:participant_id (id, name, role)
      `, { count: 'exact' })
      .eq('event_id', eventId)
      .eq('channel', channel)
      .is('deleted_at', null)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing chat messages: ${error.message}`, 500, 'DB_ERROR', error);
    }

    const messages = (data || []).map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      channel: row.channel,
      participant_id: row.participant_id,
      body: row.body,
      created_at: row.created_at,
      participant: Array.isArray(row.users) ? row.users[0] : row.users,
    }));

    return { messages, total: count || 0 };
  }

  public async deleteChatMessage(messageId: string): Promise<void> {
    const { error } = await supabase.client
      .from(this.chatTable)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      throw new AppError(`Database error deleting chat message: ${error.message}`, 500, 'DB_ERROR', error);
    }
  }

  // ---------------------------------------------------------------------------
  // QUESTIONS (Q&A)
  // ---------------------------------------------------------------------------

  public async createQuestion(eventId: string, userId: string, body: string): Promise<Question> {
    const { data, error } = await supabase.client
      .from(this.questionsTable)
      .insert({
        event_id: eventId,
        participant_id: userId,
        body,
      })
      .select(`
        id,
        event_id,
        participant_id,
        body,
        answered,
        answer,
        answered_by,
        upvotes,
        created_at,
        users:participant_id (id, name)
      `)
      .single();

    if (error) {
      throw new AppError(`Database error creating question: ${error.message}`, 500, 'DB_ERROR', error);
    }

    const userObj = Array.isArray(data.users) ? data.users[0] : data.users;

    return {
      id: data.id,
      event_id: data.event_id,
      participant_id: data.participant_id,
      body: data.body,
      answered: data.answered,
      answer: data.answer,
      answered_by: data.answered_by,
      upvotes: data.upvotes,
      created_at: data.created_at,
      participant: userObj,
    } as unknown as Question;
  }

  public async listQuestions(eventId: string, userId?: string): Promise<Question[]> {
    const { data, error } = await supabase.client
      .from(this.questionsTable)
      .select(`
        id,
        event_id,
        participant_id,
        body,
        answered,
        answer,
        answered_by,
        upvotes,
        created_at,
        users:participant_id (id, name)
      `)
      .eq('event_id', eventId)
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing questions: ${error.message}`, 500, 'DB_ERROR', error);
    }

    let userUpvotes: Set<string> = new Set();
    if (userId) {
      const { data: upvoted } = await supabase.client
        .from(this.upvotesTable)
        .select('question_id')
        .eq('user_id', userId);
      userUpvotes = new Set((upvoted || []).map((u: any) => u.question_id));
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      participant_id: row.participant_id,
      body: row.body,
      answered: row.answered,
      answer: row.answer,
      answered_by: row.answered_by,
      upvotes: row.upvotes,
      created_at: row.created_at,
      participant: Array.isArray(row.users) ? row.users[0] : row.users,
      hasUpvoted: userUpvotes.has(row.id),
    }));
  }

  public async upvoteQuestion(questionId: string, userId: string): Promise<number> {
    // Check if already upvoted
    const { data: existing } = await supabase.client
      .from(this.upvotesTable)
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      throw new AppError('You have already upvoted this question.', 409, 'ALREADY_UPVOTED');
    }

    await supabase.client
      .from(this.upvotesTable)
      .insert({ question_id: questionId, user_id: userId });

    const { data: q } = await supabase.client
      .from(this.questionsTable)
      .select('upvotes')
      .eq('id', questionId)
      .single();

    const newUpvotes = (q?.upvotes || 0) + 1;
    await supabase.client
      .from(this.questionsTable)
      .update({ upvotes: newUpvotes })
      .eq('id', questionId);

    return newUpvotes;
  }

  public async answerQuestion(questionId: string, answer: string, answeredBy: string): Promise<Question> {
    const { data, error } = await supabase.client
      .from(this.questionsTable)
      .update({
        answer,
        answered: true,
        answered_by: answeredBy,
      })
      .eq('id', questionId)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error answering question: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Question;
  }

  // ---------------------------------------------------------------------------
  // POLLS
  // ---------------------------------------------------------------------------

  public async createPoll(eventId: string, question: string, options: string[], createdBy: string): Promise<Poll> {
    const { data: poll, error: pollError } = await supabase.client
      .from(this.pollsTable)
      .insert({
        event_id: eventId,
        question,
        status: 'OPEN',
        created_by: createdBy,
      })
      .select('*')
      .single();

    if (pollError) {
      throw new AppError(`Database error creating poll: ${pollError.message}`, 500, 'DB_ERROR', pollError);
    }

    const optionsPayload = options.map((opt) => ({
      poll_id: poll.id,
      option_text: opt,
      vote_count: 0,
    }));

    const { data: createdOptions, error: optError } = await supabase.client
      .from(this.pollOptionsTable)
      .insert(optionsPayload)
      .select('*');

    if (optError) {
      throw new AppError(`Database error creating poll options: ${optError.message}`, 500, 'DB_ERROR', optError);
    }

    return {
      ...poll,
      options: createdOptions as PollOption[],
    };
  }

  public async listPolls(eventId: string, userId?: string): Promise<Poll[]> {
    const { data: polls, error } = await supabase.client
      .from(this.pollsTable)
      .select(`
        id,
        event_id,
        question,
        status,
        created_by,
        created_at,
        options:poll_options (id, poll_id, option_text, vote_count)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing polls: ${error.message}`, 500, 'DB_ERROR', error);
    }

    let userVotesMap = new Map<string, string>();
    if (userId) {
      const { data: votes } = await supabase.client
        .from(this.pollVotesTable)
        .select('poll_id, option_id')
        .eq('user_id', userId);

      (votes || []).forEach((v: any) => userVotesMap.set(v.poll_id, v.option_id));
    }

    return (polls || []).map((p: any) => ({
      id: p.id,
      event_id: p.event_id,
      question: p.question,
      status: p.status,
      created_by: p.created_by,
      created_at: p.created_at,
      options: p.options || [],
      userVotedOptionId: userVotesMap.get(p.id) || null,
    }));
  }

  public async votePoll(pollId: string, optionId: string, userId: string): Promise<void> {
    const { data: poll } = await supabase.client
      .from(this.pollsTable)
      .select('status')
      .eq('id', pollId)
      .single();

    if (!poll || poll.status !== 'OPEN') {
      throw new AppError('This poll is closed for voting.', 400, 'POLL_CLOSED');
    }

    // Check if user already voted
    const { data: existingVote } = await supabase.client
      .from(this.pollVotesTable)
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingVote) {
      throw new AppError('You have already voted in this poll.', 409, 'ALREADY_VOTED');
    }

    // Insert vote
    await supabase.client
      .from(this.pollVotesTable)
      .insert({ poll_id: pollId, option_id: optionId, user_id: userId });

    // Increment option count
    const { data: opt } = await supabase.client
      .from(this.pollOptionsTable)
      .select('vote_count')
      .eq('id', optionId)
      .single();

    const newVoteCount = (opt?.vote_count || 0) + 1;
    await supabase.client
      .from(this.pollOptionsTable)
      .update({ vote_count: newVoteCount })
      .eq('id', optionId);
  }

  public async closePoll(pollId: string): Promise<void> {
    const { error } = await supabase.client
      .from(this.pollsTable)
      .update({ status: 'CLOSED' })
      .eq('id', pollId);

    if (error) {
      throw new AppError(`Database error closing poll: ${error.message}`, 500, 'DB_ERROR', error);
    }
  }
}

export const announcementRepository = new AnnouncementRepository();
