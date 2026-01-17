/**
 * 健康检查路由
 */

import type { SimpleContext } from '../utils/koa-adapter';
import { config } from '../config';

/**
 * 健康检查
 */
export async function health(ctx: SimpleContext): Promise<void> {
  ctx.body = {
    status: 'ok',
    version: config.app.version,
    timestamp: new Date().toISOString(),
  };
}
