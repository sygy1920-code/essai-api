/**
 * JWT 认证中间件
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface DecodedToken {
  memberId: string;
  rolekey: 'teachers' | 'students';
  school: string;
  email: string;
  class: string;
}

/**
 * 验证 JWT 令牌
 * @param token JWT 令牌
 * @returns 解码后的令牌数据
 */
export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded as DecodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * 生成 JWT 令牌
 * @param payload 令牌载荷
 * @returns JWT 令牌
 */
export function generateToken(payload: any): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * 从请求头提取 JWT 令牌
 * @param authHeader Authorization 头
 * @returns JWT 令牌
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
}
