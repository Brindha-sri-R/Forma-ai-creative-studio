import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  [key: string]: any;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret as jwt.Secret, {
    expiresIn: config.jwtExpiresIn as any,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret as jwt.Secret) as TokenPayload;
  } catch (error) {
    return null;
  }
}
