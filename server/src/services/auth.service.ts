import { config } from '../config';
import { HttpError } from '../middlewares/error.middleware';
import { userService } from './user.service';
import { signToken } from './token.service';

// 微信 code 换 openid：调用 code2Session 接口
async function codeToOpenid(code: string): Promise<{ openid: string; unionid?: string }> {
  if (!config.wx.appId || !config.wx.appSecret) {
    throw new HttpError(500, '微信登录未配置 WX_APP_ID / WX_APP_SECRET');
  }
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wx.appId}&secret=${config.wx.appSecret}&js_code=${code}&grant_type=authorization_code`;
  let data: { openid?: string; unionid?: string; errcode?: number; errmsg?: string };
  try {
    const resp = await fetch(url);
    data = await resp.json() as typeof data;
  } catch (e) {
    throw new HttpError(502, '请求微信服务器失败');
  }
  if (data.errcode || !data.openid) {
    throw new HttpError(401, `微信登录失败: ${data.errmsg || '未知错误'} (${data.errcode ?? 'no errcode'})`);
  }
  return { openid: data.openid, unionid: data.unionid };
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
