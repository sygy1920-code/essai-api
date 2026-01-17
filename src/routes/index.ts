/**
 * 路由定义
 */

import type { RouteHandler } from '../utils/koa-adapter';
import { login } from './auth';
import { getCurrentUser, getUsers } from './users';
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

  // 认证路由（无需认证）
  {
    method: 'POST',
    path: '/auth/login',
    handler: login,
    requireAuth: false,
  },

  // 用户路由（需要认证）
  {
    method: 'GET',
    path: '/users/me',
    handler: getCurrentUser,
    requireAuth: true,
  },

  {
    method: 'GET',
    path: '/users',
    handler: getUsers,
    requireAuth: true,
  },
];
