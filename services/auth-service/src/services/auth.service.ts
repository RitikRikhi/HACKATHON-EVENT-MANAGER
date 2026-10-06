import bcrypt from 'bcryptjs';
import { ConflictError, UnauthorizedError, NotFoundError, signToken, BadRequestError } from '@event-os/config';
import {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  UserDTO,
  User,
  UserRole,
  AuthTokenPayload,
  UpdateProfileDTO,
  ChangePasswordDTO,
} from '@event-os/types';
import { userRepository } from '../repositories/user.repository';
import { mailService } from './mail.service';

export class AuthService {
  private saltRounds = 10;

  private mapToDTO(user: User): UserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      profileImage: user.profile_image || null,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  public async register(dto: RegisterDTO): Promise<AuthResponse> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    const newUser = await userRepository.create({
      name: dto.name,
      email: dto.email,
      password_hash: passwordHash,
      role: dto.role || UserRole.PARTICIPANT,
      phone: dto.phone,
      profile_image: dto.profileImage,
    });

    const tokenPayload: AuthTokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    const token = signToken(tokenPayload);
    const userDTO = this.mapToDTO(newUser);

    // Trigger registration email asynchronously (non-blocking)
    mailService.sendRegistrationEmail(newUser.email, newUser.name).catch((err) => {
      console.error('[AuthService] Error in async registration email:', err);
    });

    return {
      token,
      user: userDTO,
    };
  }

  public async login(dto: LoginDTO, clientIp?: string): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const tokenPayload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = signToken(tokenPayload);
    const userDTO = this.mapToDTO(user);

    // Trigger login alert email asynchronously (non-blocking)
    mailService.sendLoginAlertEmail(user.email, user.name, clientIp).catch((err) => {
      console.error('[AuthService] Error in async login alert email:', err);
    });

    return {
      token,
      user: userDTO,
    };
  }

  public async getProfile(userId: string): Promise<UserDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return this.mapToDTO(user);
  }

  public async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<UserDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const updated = await userRepository.updateProfile(userId, {
      name: dto.name,
      phone: dto.phone,
      profile_image: dto.profileImage,
    });

    return this.mapToDTO(updated);
  }

  public async changePassword(userId: string, dto: ChangePasswordDTO): Promise<{ message: string }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const currentPwd = dto.currentPassword || dto.oldPassword || '';
    const isMatch = await bcrypt.compare(currentPwd, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect.');
    }

    if (currentPwd === dto.newPassword) {
      throw new BadRequestError('New password must be different from current password.');
    }

    const newHash = await bcrypt.hash(dto.newPassword, this.saltRounds);
    await userRepository.updatePassword(userId, newHash);

    return { message: 'Password changed successfully' };
  }

  public async getUserById(userId: string): Promise<UserDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found.`);
    }
    return this.mapToDTO(user);
  }

  public async listUsers(page = 1, limit = 20): Promise<{ users: UserDTO[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const { users, total } = await userRepository.list(limit, offset);
    return {
      users: users.map((u) => this.mapToDTO(u)),
      total,
      page,
      limit,
    };
  }

  public async updateUserRole(userId: string, newRole: UserRole): Promise<UserDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found.`);
    }

    const updated = await userRepository.updateRole(userId, newRole);
    return this.mapToDTO(updated);
  }
}

export const authService = new AuthService();
