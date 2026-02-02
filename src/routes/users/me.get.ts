/**
 * 获取当前用户信息
 * GET /users/me
 */

import { HttpContext } from '../../types';

export async function handler(ctx: HttpContext): Promise<void> {
  if (!ctx.user) {
    ctx.status = 401;
    ctx.body = {
      error: 'Unauthorized',
    };
    return;
  }

  ctx.status = 200;
  ctx.body = {
    success: true,
    user: ctx.user,
  };
}
