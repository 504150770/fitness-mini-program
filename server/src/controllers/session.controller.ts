import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { sessionService } from '../services/session.service';
import { success } from '../utils/response';

function toLogDto(l: { id: string; exerciseId: string; exerciseName: string; setOrder: number; weightKg: number; reps: number; volumeKg: number; isPR: boolean; note: string | null }) {
  return { id: l.id, exerciseId: l.exerciseId, exerciseName: l.exerciseName, setOrder: l.setOrder, weightKg: l.weightKg, reps: l.reps, volumeKg: l.volumeKg, isPR: l.isPR, note: l.note };
}

function toSessionDto(s: { id: string; planId: string | null; planName: string | null; name: string; startedAt: Date; endedAt: Date | null; status: string; totalVolumeKg: number; note: string | null; logs?: Array<ReturnType<typeof toLogDto>> }) {
  return {
    id: s.id, planId: s.planId, planName: s.planName, name: s.name,
    startedAt: s.startedAt.toISOString(), endedAt: s.endedAt ? s.endedAt.toISOString() : null,
    status: s.status, totalVolumeKg: s.totalVolumeKg, note: s.note,
    logs: s.logs ? s.logs.map(toLogDto) : [],
  };
}

function toSessionListItem(s: { id: string; planName: string | null; name: string; startedAt: Date; endedAt: Date | null; status: string; totalVolumeKg: number; _count?: { logs: number } }) {
  return {
    id: s.id, name: s.name, planName: s.planName,
    startedAt: s.startedAt.toISOString(), endedAt: s.endedAt ? s.endedAt.toISOString() : null,
    status: s.status, totalVolumeKg: s.totalVolumeKg, logCount: s._count?.logs ?? 0,
  };
}

export const sessionController = {
  async start(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { session, plannedExercises } = await sessionService.start(req.userId as string, req.body || {});
      res.json(success({ session: toSessionDto(session), plannedExercises }, '训练已开始'));
    } catch (e) { next(e); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const items = await sessionService.list(req.userId as string, { limit: limit ? Number(limit) : undefined });
      res.json(success(items.map(toSessionListItem)));
    } catch (e) { next(e); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const s = await sessionService.getById(req.userId as string, req.params.id);
      res.json(success(toSessionDto(s)));
    } catch (e) { next(e); }
  },

  async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const s = await sessionService.complete(req.userId as string, req.params.id, req.body || {});
      res.json(success(toSessionDto({ ...s, logs: [] }), '训练已完成'));
    } catch (e) { next(e); }
  },

  async addLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const log = await sessionService.addLog(req.userId as string, req.params.id, req.body || {});
      res.json(success(toLogDto(log), log.isPR ? '新PR！' : '已记录'));
    } catch (e) { next(e); }
  },

  async updateLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const log = await sessionService.updateLog(req.userId as string, req.params.id, req.params.logId, req.body || {});
      res.json(success(toLogDto(log), '已更新'));
    } catch (e) { next(e); }
  },

  async removeLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await sessionService.removeLog(req.userId as string, req.params.id, req.params.logId);
      res.json(success(null, '已删除'));
    } catch (e) { next(e); }
  },

  async copyLastSet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const log = await sessionService.copyLastSet(req.userId as string, req.params.id, (req.body || {}).exerciseId);
      res.json(success(toLogDto(log), '已复制上一组'));
    } catch (e) { next(e); }
  },

  async listPRs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prs = await sessionService.listPRs(req.userId as string);
      res.json(success(prs.map(p => ({
        id: p.id, exerciseId: p.exerciseId, exerciseName: p.exerciseName,
        maxWeightKg: p.maxWeightKg, maxWeightReps: p.maxWeightReps, achievedAt: p.achievedAt.toISOString(),
      }))));
    } catch (e) { next(e); }
  },
};