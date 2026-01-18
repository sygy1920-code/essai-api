/**
 * 作业提交相关路由
 */

import { prisma } from '../db/connection';
import { c_userdata } from '@prisma/client';
import { HttpContext } from '../types';

/**
 * 分页参数接口
 */
interface PaginationParams {
  page?: number;
  pageSize?: number;
  lang?: 'en' | 'hk';
}

/**
 * 获取全部作业列表（支持分页和多语言）
 */
export async function getSubmissionList(ctx: HttpContext): Promise<void> {
  if (!ctx.user) {
    ctx.status = 401;
    ctx.body = {
      error: 'Unauthorized',
    };
    return;
  }

  // 解析查询参数
  const query = ctx.req.query;
  const page = parseInt(query.get('page') || '1', 10);
  const pageSize = parseInt(query.get('pageSize') || '10', 10);
  const lang = (query.get('lang') || 'en') as 'en' | 'hk';

  // 验证参数
  if (page < 1 || pageSize < 1 || pageSize > 100) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid pagination parameters. Page must be >= 1, pageSize must be between 1 and 100',
    };
    return;
  }

  if (lang !== 'en' && lang !== 'hk') {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid lang parameter. Must be "en" or "hk"',
    };
    return;
  }

  try {
    // 根据语言选择不同的表
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    let submissions: c_userdata[];
    let totalCount: number;

    if (lang === 'hk') {
      // 使用 c_userdata 表
      [submissions, totalCount] = await Promise.all([
        prisma.c_userdata.findMany({
          where: {
            ownerId: ctx.user.memberId,
            YN: true,
          },
          skip,
          take,
          orderBy: {
            id: 'desc',
          },
        }),
        prisma.c_userdata.count({
          where: {
            ownerId: ctx.user.memberId,
            YN: true,
          },
        }),
      ]);
    } else {
      // 使用 userdata 表（默认 en）
      [submissions, totalCount] = await Promise.all([
        prisma.userdata.findMany({
          where: {
            ownerId: ctx.user.memberId,
            YN: true,
          },
          skip,
          take,
          orderBy: {
            id: 'desc',
          },
        }),
        prisma.userdata.count({
          where: {
            ownerId: ctx.user.memberId,
            YN: true,
          },
        }),
      ]);
    }

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: submissions,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: page * pageSize < totalCount,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching submission list:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
