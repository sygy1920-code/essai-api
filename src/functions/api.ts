/**
 * 主 API 入口
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { createRouterHandler } from '../utils/koa-adapter';
import { routes } from '../app';

// 创建路由处理器
const routerHandler = createRouterHandler(routes);

/**
 * HTTP 触发函数处理所有请求
 */
async function apiHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`HTTP trigger function received ${req.method} request to ${req.url}`);

  try {
    return await routerHandler(req);
  } catch (err) {
    context.error(`Error processing request: ${err}`);
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
}

// 注册 HTTP 触发函数
app.http('web_api', {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  route: '{*path}',
  authLevel: 'anonymous',
  handler: apiHandler,
});
