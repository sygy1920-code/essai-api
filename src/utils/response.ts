/**
 * 响应工具函数
 */

import { HttpResponseInit } from '@azure/functions/types/http';

/**
 * 生成成功响应
 */
export function success(data: any, status = 200): HttpResponseInit {
  return {
    status,
    body: JSON.stringify({
      success: true,
      data,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * 生成错误响应
 */
export function error(message: string, status = 400): HttpResponseInit {
  return {
    status,
    body: JSON.stringify({
      success: false,
      error: message,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}
