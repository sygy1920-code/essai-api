/**
 * 健康检查路由
 * GET /health
 */

import type { HttpContext } from '../../types';
import { config } from '../../config';

export async function handler(ctx: HttpContext): Promise<void> {
  ctx.body = {
    status: 'ok',
    version: config.app.version,
    timestamp: new Date().toISOString(),
  };
}
