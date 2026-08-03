import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { exportService } from '../services/export.service';
import { success } from '../utils/response';

export const exportController = {
  async exportCsv(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const type = (req.query.type as string) || 'training';
      const result = await exportService.exportCsv(req.userId as string, type);
      res.json(success('\uFEFF' + result.csv, '导出成功'));
    } catch (e) { next(e); }
  },
};