/**
 * Azure Functions 到 Router 的适配器
 */

import { HttpRequest, HttpResponseInit } from '@azure/functions';
import { verifyToken, extractToken, DecodedToken } from '../middleware/auth';

// 简化的 Context 类型
export interface SimpleContext {
  request: {
    body?: any;
    query: Record<string, string>;
  };
  query: Record<string, string>;
  path: string;
  method: string;
  headers: Record<string, string>;
  status: number;
  body?: any;
  user?: DecodedToken;
  state: {
    requireAuth?: boolean;
  };
  params: Record<string, string>;
}

export type RouteHandler = (ctx: SimpleContext, next: () => Promise<void>) => void | Promise<void>;

// 路由配置
interface RouteConfig {
  method: string;
  path: string;
  handler: RouteHandler;
  requireAuth?: boolean;
}

/**
 * 创建路由处理器
 */
export function createRouterHandler(routes: RouteConfig[]) {
  return async function (req: HttpRequest): Promise<HttpResponseInit> {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api/, '');
    const method = req.method.toUpperCase();

    // 查找匹配的路由
    const route = findRoute(routes, method, path);

    if (!route) {
      return {
        status: 404,
        body: JSON.stringify({ error: 'Route not found' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // 创建简化的 context
    const ctx: SimpleContext = {
      request: {
        query: Object.fromEntries(url.searchParams.entries()),
      },
      query: Object.fromEntries(url.searchParams.entries()),
      path,
      method,
      headers: Object.fromEntries(req.headers.entries()),
      status: 200,
      state: {},
      params: extractParams(route.path, path),
    };

    // 解析请求体
    if (req.body) {
      if (typeof req.body === 'string') {
        try {
          ctx.request.body = JSON.parse(req.body);
        } catch {
          ctx.request.body = req.body;
        }
      } else {
        ctx.request.body = req.body;
      }
    }

    // JWT 认证检查
    const requireAuth = route.requireAuth !== false;
    if (requireAuth) {
      const authHeader = req.headers.get('Authorization');
      const token = extractToken(authHeader || undefined) || ctx.query['jwt'];

      if (!token) {
        return {
          status: 401,
          body: JSON.stringify({ error: 'Missing or invalid authorization header' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return {
          status: 401,
          body: JSON.stringify({ error: 'Invalid or expired token' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      ctx.user = decoded;
    }


    console.log('Current user:', ctx.user);

    // 执行路由处理函数
    await route.handler(ctx, async () => { });

    // 转换响应
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let body: string | undefined;
    if (ctx.body !== undefined) {
      if (typeof ctx.body === 'string') {
        body = ctx.body;
      } else {
        body = JSON.stringify(ctx.body);
      }
    }

    return {
      status: ctx.status || 200,
      body,
      headers,
    };
  };
}

/**
 * 查找匹配的路由
 */
function findRoute(routes: RouteConfig[], method: string, path: string): RouteConfig | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    // 简单的路径匹配（支持参数）
    const routePattern = route.path.replace(/:([^/]+)/g, '([^/]+)');
    const regex = new RegExp(`^${routePattern}$`);

    if (regex.test(path)) {
      return route;
    }
  }
  return null;
}

/**
 * 提取路径参数
 */
function extractParams(routePath: string, actualPath: string): Record<string, string> {
  const params: Record<string, string> = {};

  const routeParts = routePath.split('/');
  const actualParts = actualPath.split('/');

  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    if (routePart.startsWith(':')) {
      const paramName = routePart.slice(1);
      params[paramName] = actualParts[i];
    }
  }

  return params;
}
