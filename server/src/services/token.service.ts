import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export function signToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign({ userId }, config.jwtSecret, options);
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, config.jwtSecret) as { userId: string };
}