/**
 * 用户相关路由
 */

import type { SimpleContext } from '../utils/koa-adapter';

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(ctx: SimpleContext): Promise<void> {
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

/**
 * 获取所有用户（演示）
 */
export async function getUsers(ctx: SimpleContext): Promise<void> {
  // 模拟数据
  const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ];

  ctx.status = 200;
  ctx.body = {
    success: true,
    data: users,
  };
}
