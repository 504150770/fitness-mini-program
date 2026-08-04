import type { Request, Response, NextFunction } from 'express';
import app from '../src/app';
import { ensureDatabase } from '../src/config/db-init';

app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await ensureDatabase();
  next();
});

export default app;