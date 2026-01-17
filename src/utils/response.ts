/**
 * 响应工具函数
 */

import { ApiResponse } from '../types';

/**
 * 生成成功响应
 */
export function success(data: any, status = 200): any {
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
export function error(message: string, status = 400): any {
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
