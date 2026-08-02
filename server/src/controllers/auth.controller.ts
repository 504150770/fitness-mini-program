import type { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { success } from '../utils/response';
import { HttpError } from '../middlewares/error.middleware';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const authController = {
  async devLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const openid = (req.body?.openid as string)?.trim() || 'tester';
      const data = await authService.devLogin(openid);
      res.json(success(data, '开发登录成功'));
    } catch (e) {
      next(e);
    }
  },

  async wxLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const code = (req.body?.code as string)?.trim();
      if (!code) throw new HttpError(400, 'code 不能为空', 400);
      const data = await authService.wxLogin(code);
      res.json(success(data, '登录成功'));
    } catch (e) {
      next(e);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.findById(req.userId as string);
      if (!user) throw new HttpError(404, '用户不存在', 404);
      res.json(success({ id: user.id, openid: user.openid, nickname: user.nickname }));
    } catch (e) {
      next(e);
    }
  },
};
