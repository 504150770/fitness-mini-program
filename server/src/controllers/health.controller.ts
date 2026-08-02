import type { Request, Response } from 'express';
import { config } from '../config';
import { success } from '../utils/response';

export const healthController = {
  check(_req: Request, res: Response) {
    res.json(success({ status: 'ok', env: config.nodeEnv, time: new Date().toISOString() }));
  },
};
