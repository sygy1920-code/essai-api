/**
 * 用户相关路由
 */

import type { SimpleContext } from '../utils/koa-adapter';
import { wixService } from '../services/wixService';

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
 * 获取教师的所有学生列表
 */
export async function getMyStudents(ctx: SimpleContext): Promise<void> {
  if (ctx.user.rolekey !== 'teachers') {
    ctx.status = 403;
    ctx.body = {
      error: 'Forbidden: Only teachers can access this resource',
    };
    return;
  }

  const users = await wixService.getStudentsByTeacher(ctx.user.email);

  ctx.status = 200;
  ctx.body = {
    success: true,
    data: users,
  };
}
