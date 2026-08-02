import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { HttpError } from './error.middleware';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authRequired(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return next(new HttpError(401, '未登录', 401));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    next(new HttpError(401, '登录已过期', 401));
  }
}
