/**
 * 获取教师的所有学生列表
 * GET /users/students
 */

import { userService } from '../../services/userService';
import { HttpContext } from '../../types';

export async function handler(ctx: HttpContext): Promise<void> {
  if (ctx.user.rolekey !== 'teachers') {
    ctx.status = 403;
    ctx.body = {
      error: 'Forbidden: Only teachers can access this resource',
    };
    return;
  }

  const users = await userService.getStudentsByTeacher(ctx.user.email);

  ctx.status = 200;
  ctx.body = {
    success: true,
    data: users,
  };
}
