import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { bodyService } from '../services/body.service';
import { success } from '../utils/response';

interface BodyRecordRow {
  id: string;
  userId: string;
  recordedAt: Date;
  weightKg: number;
  bodyFatPct: number | null;
  photoUrl: string | null;
  note: string | null;
}

function toDto(r: BodyRecordRow) {
  return {
    id: r.id,
    userId: r.userId,
    recordedAt: r.recordedAt.toISOString(),
    weightKg: r.weightKg,
    bodyFatPct: r.bodyFatPct,
    photoUrl: r.photoUrl,
    note: r.note,
  };
}

export const bodyController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const r = await bodyService.create(req.userId as string, req.body || {});
      res.json(success(toDto(r), '记录已保存'));
    } catch (e) {
      next(e);
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { from, to, limit } = req.query;
      const records = await bodyService.list(req.userId as string, {
        from: from as string | undefined,
        to: to as string | undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.json(success(records.map(toDto)));
    } catch (e) {
      next(e);
    }
  },

  async latest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const r = await bodyService.latest(req.userId as string);
      res.json(success(r ? toDto(r) : null));
    } catch (e) {
      next(e);
    }
  },

  async trend(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const data = await bodyService.trend(req.userId as string, {
        limit: limit ? Number(limit) : undefined,
      });
      res.json(success(data));
    } catch (e) {
      next(e);
    }
  },
};