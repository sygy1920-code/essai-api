/**
 * 路由类型定义
 */

import { HttpContext } from '../types';

export type RouteHandler = (ctx: HttpContext, next: () => Promise<void>) => void | Promise<void>;

export interface RouteConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  path: string;
  handler: RouteHandler;
  requireAuth?: boolean;
}
