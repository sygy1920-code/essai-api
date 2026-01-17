/**
 * 认证相关路由
 */

import { generateToken } from '../middleware/auth';
import type { SimpleContext } from '../utils/koa-adapter';

/**
 * 登录处理
 */
export async function login(ctx: SimpleContext): Promise<void> {
  try {
    const { username, password } = ctx.request.body as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      ctx.status = 400;
      ctx.body = {
        error: 'Username and password are required',
      };
      return;
    }

    // 简单的演示验证（实际应用中应检查数据库）
    if (password !== 'demo') {
      ctx.status = 401;
      ctx.body = {
        error: 'Invalid credentials',
      };
      return;
    }

    const token = generateToken({
      userId: `user_${Date.now()}`,
      username,
      createdAt: new Date().toISOString(),
    });

    ctx.status = 200;
    ctx.body = {
      success: true,
      token,
      user: { username },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: 'Login failed',
    };
  }
}
