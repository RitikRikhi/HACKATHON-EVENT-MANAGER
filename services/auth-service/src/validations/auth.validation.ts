import { BadRequestError } from '@event-os/config';
import {
  RegisterDTO,
  LoginDTO,
  UserRole,
  UpdateProfileDTO,
  ChangePasswordDTO,
} from '@event-os/types';

export const validateRegisterInput = (data: Partial<RegisterDTO>): RegisterDTO => {
  const { name, email, password, role, phone, profileImage } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new BadRequestError('Name is required and must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    throw new BadRequestError('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new BadRequestError('Password is required and must be at least 6 characters long.');
  }

  if (role && !Object.values(UserRole).includes(role)) {
    throw new BadRequestError(`Invalid role. Valid roles are: ${Object.values(UserRole).join(', ')}`);
  }

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: role || UserRole.PARTICIPANT,
    phone: phone ? phone.trim() : undefined,
    profileImage: profileImage ? profileImage.trim() : undefined,
  };
};

export const validateLoginInput = (data: Partial<LoginDTO>): LoginDTO => {
  const { email, password } = data;

  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    throw new BadRequestError('A valid email address is required.');
  }

  if (!password || typeof password !== 'string') {
    throw new BadRequestError('Password is required.');
  }

  return {
    email: email.trim().toLowerCase(),
    password,
  };
};

export const validateUpdateProfileInput = (data: Record<string, unknown>): UpdateProfileDTO => {
  const { name, phone, profileImage, role, id, password, email } = data;

  // Strict check: if forbidden protected fields are explicitly sent, disallow tampering
  if (role !== undefined || id !== undefined || password !== undefined || email !== undefined) {
    // Specifically protect system fields
    if (role !== undefined) {
      throw new BadRequestError('Cannot modify protected field: role');
    }
    if (password !== undefined) {
      throw new BadRequestError('Cannot modify password via profile endpoint. Use /auth/change-password.');
    }
  }

  const updates: UpdateProfileDTO = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      throw new BadRequestError('Name must be at least 2 characters long.');
    }
    updates.name = name.trim();
  }

  if (phone !== undefined) {
    if (phone !== null && typeof phone !== 'string') {
      throw new BadRequestError('Phone must be a valid string.');
    }
    updates.phone = typeof phone === 'string' ? phone.trim() : undefined;
  }

  if (profileImage !== undefined) {
    if (profileImage !== null && typeof profileImage !== 'string') {
      throw new BadRequestError('Profile image must be a valid string or URL.');
    }
    updates.profileImage = typeof profileImage === 'string' ? profileImage.trim() : undefined;
  }

  return updates;
};

export const validateChangePasswordInput = (data: Record<string, unknown>): ChangePasswordDTO => {
  const currentPassword = (data.currentPassword || data.oldPassword) as string | undefined;
  const newPassword = data.newPassword as string | undefined;

  if (!currentPassword || typeof currentPassword !== 'string') {
    throw new BadRequestError('Current password (oldPassword / currentPassword) is required.');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new BadRequestError('New password is required and must be at least 6 characters long.');
  }

  if (currentPassword === newPassword) {
    throw new BadRequestError('New password must be different from the current password.');
  }

  return {
    currentPassword,
    oldPassword: currentPassword,
    newPassword,
  };
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
