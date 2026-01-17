/**
 * 路由定义
 */

import type { RouteHandler } from '../utils/koa-adapter';
import { getCurrentUser, getMyStudents } from './users';
import { health } from './health';

export interface RouteConfig {
  method: string;
  path: string;
  handler: RouteHandler;
  requireAuth?: boolean;
}

export const routes: RouteConfig[] = [
  // 健康检查（无需认证）
  {
    method: 'GET',
    path: '/health',
    handler: health,
    requireAuth: false,
  },

  // 用户路由（需要认证）
  {
    method: 'GET',
    path: '/users/me',
    handler: getCurrentUser,
    requireAuth: true,
  },

  // 获取自己的学生列表（需要认证）
  {
    method: 'GET',
    path: '/students/list',
    handler: getMyStudents,
    requireAuth: true,
  },
];
