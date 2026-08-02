import type { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/response';

export class HttpError extends Error {
  status: number;
  code: number;
  constructor(status: number, message: string, code = -1) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function notFound(_req: Request, res: Response, _next: NextFunction) {
  res.status(404).json(fail('资源不存在', 404));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json(fail(err.message, err.code));
    return;
  }
  console.error('[unhandled error]', err);
  res.status(500).json(fail('服务器内部错误', 500));
}
