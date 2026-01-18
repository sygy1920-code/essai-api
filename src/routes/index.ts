/**
 * 路由定义
 */

import { getCurrentUser, getMyStudents } from './users';
import { health } from './health';
import { getSubmissionList } from './submissions';
import { getStudentHomeworks } from './student-homework';
import { HttpContext } from '../types';

export type RouteHandler = (ctx: HttpContext, next: () => Promise<void>) => void | Promise<void>;

export interface RouteConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
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
    path: '/users/students',
    handler: getMyStudents,
    requireAuth: true,
  },

  // 获取作业提交列表（需要认证，支持分页和多语言）
  {
    method: 'GET',
    path: '/submission/list',
    handler: getSubmissionList,
    requireAuth: true,
  },

  // 获取学生所有作业表（需要认证，支持时间筛选和多语言）
  {
    method: 'GET',
    path: '/student-homeworks',
    handler: getStudentHomeworks,
    requireAuth: true,
  },
];
