/**
 * 主 API 入口
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { routes, RouteConfig } from '../routes';
import { extractToken, verifyToken } from '../middleware/auth';
import { HttpContext } from '../types';

export function handleRouter(route: RouteConfig) {
  return async function (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    // JWT 认证检查
    const requireAuth = route.requireAuth !== false;
    
    const ctx: HttpContext = {
      status: 200,
      req: req,
      state: {
        requireAuth,
      },
    };
    
    if (requireAuth) {
      const authHeader = req.headers.get('Authorization');
      const token = extractToken(authHeader || undefined) || req.query.get('jwt');

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

    // 执行路由处理函数
    try {
      await route.handler(ctx, async () => { });
    } catch (err) {
      console.error(`Error processing request: ${err}`);
      return {
        status: 500,
        body: JSON.stringify({
          error: 'Internal server error',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

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


routes.forEach(route => {
  const routeName = route.path.replace(/\//g, '_').replace(/{|}/g, '');
  const routePath = route.path.startsWith('/') ? route.path.substring(1) : route.path;

  // 注册 HTTP 触发函数
  app.http(`${route.method.toLowerCase()}${routeName}`, {
    methods: [route.method],
    route: routePath,
    handler: handleRouter(route),
  });
});
