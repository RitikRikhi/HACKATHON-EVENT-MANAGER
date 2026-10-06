import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { AuthTokenPayload } from '@event-os/types';
import { env } from './env';

export const signToken = (
  payload: AuthTokenPayload,
  expiresIn: string | number = env.JWT_EXPIRES_IN
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET as Secret, options);
};

export const verifyToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET as Secret) as AuthTokenPayload;
};

export const decodeToken = (token: string): AuthTokenPayload | null => {
  return jwt.decode(token) as AuthTokenPayload | null;
};
