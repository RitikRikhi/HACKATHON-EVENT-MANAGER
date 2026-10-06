import { BadRequestError } from '@event-os/config';
import {
  CreateTeamDTO,
  AddTeamMemberDTO,
  JoinTeamByCodeDTO,
  CreateInviteLinkDTO,
  TransferLeadershipDTO,
  TeamRole,
} from '@event-os/types';

export const validateCreateTeamInput = (data: Partial<CreateTeamDTO>): CreateTeamDTO => {
  const { name, description, eventId } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new BadRequestError('Team name is required and must be at least 2 characters long.');
  }

  if (!eventId || typeof eventId !== 'string') {
    throw new BadRequestError('A valid eventId (UUID) is required.');
  }

  return {
    name: name.trim(),
    description: description ? description.trim() : undefined,
    eventId: eventId.trim(),
  };
};

export const validateJoinByCodeInput = (data: Partial<JoinTeamByCodeDTO>): JoinTeamByCodeDTO => {
  const { teamCode } = data;

  if (!teamCode || typeof teamCode !== 'string' || teamCode.trim().length < 3) {
    throw new BadRequestError('A valid teamCode is required.');
  }

  return {
    teamCode: teamCode.trim().toUpperCase(),
  };
};

export const validateCreateInviteLinkInput = (data: Partial<CreateInviteLinkDTO>): CreateInviteLinkDTO => {
  const { maxUses, expiresInHours } = data;

  if (maxUses !== undefined && (typeof maxUses !== 'number' || maxUses <= 0)) {
    throw new BadRequestError('maxUses must be a positive integer.');
  }

  if (expiresInHours !== undefined && (typeof expiresInHours !== 'number' || expiresInHours <= 0)) {
    throw new BadRequestError('expiresInHours must be a positive number.');
  }

  return {
    maxUses: maxUses ? Math.floor(maxUses) : undefined,
    expiresInHours: expiresInHours ? Number(expiresInHours) : 24, // default 24 hours
  };
};

export const validateTransferLeadershipInput = (data: any): TransferLeadershipDTO => {
  const newLeaderId = data.newLeaderId || data.newLeadId || data.userId;

  if (!newLeaderId || typeof newLeaderId !== 'string') {
    throw new BadRequestError('A valid newLeaderId (UUID) is required.');
  }

  return {
    newLeaderId: newLeaderId.trim(),
  };
};

export const validateAddMemberInput = (data: Partial<AddTeamMemberDTO>): AddTeamMemberDTO => {
  const { userId, role } = data;

  if (!userId || typeof userId !== 'string') {
    throw new BadRequestError('A valid userId (UUID) is required.');
  }

  if (role && !Object.values(TeamRole).includes(role)) {
    throw new BadRequestError(`Invalid team role. Allowed roles: ${Object.values(TeamRole).join(', ')}`);
  }

  return {
    userId: userId.trim(),
    role: role || TeamRole.MEMBER,
  };
};
