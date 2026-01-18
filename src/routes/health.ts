/**
 * 健康检查路由
 */

import type { HttpContext } from '../types';
import { config } from '../config';

/**
 * 健康检查
 */
export async function health(ctx: HttpContext): Promise<void> {
  ctx.body = {
    status: 'ok',
    version: config.app.version,
    timestamp: new Date().toISOString(),
  };
}
