import { config } from '../config';
import { HttpError } from '../middlewares/error.middleware';
import { userService } from './user.service';
import { signToken } from './token.service';

// 微信 code 换 openid：接口与配置位置已就绪，待补充真实网络调用（不阻塞开发）
async function codeToOpenid(code: string): Promise<{ openid: string; unionid?: string }> {
  if (!config.wx.appId || !config.wx.appSecret) {
    throw new HttpError(500, '微信登录未配置 WX_APP_ID / WX_APP_SECRET', 500);
  }
  throw new HttpError(501, `微信正式登录待实现（code=${code}）`, 501);
}

export const authService = {
  async devLogin(openid: string) {
    const user = await userService.getOrCreateByOpenid('dev_' + openid);
    return {
      user: { id: user.id, openid: user.openid, nickname: user.nickname },
      token: signToken(user.id),
    };
  },

  async wxLogin(code: string) {
    const { openid, unionid } = await codeToOpenid(code);
    const user = await userService.getOrCreateByOpenid(openid, { unionid });
    return {
      user: { id: user.id, openid: user.openid, nickname: user.nickname },
      token: signToken(user.id),
    };
  },
};
