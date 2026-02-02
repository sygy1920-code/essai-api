/**
 * 获取全部作业列表（支持分页和多语言）
 * GET /submission/list
 *
 * 查询参数:
 * - page: 页码，默认 1
 * - pageSize: 每页数量，默认 10，最大 100
 * - lang: 语言版本 (en/hk)，默认 en
 * - class: 班级名称（可选）
 * - startDate: 开始日期（可选），ISO 8601 格式
 * - endDate: 结束日期（可选），ISO 8601 格式
 */

import { prisma } from '../../db/connection';
import { c_userdata } from '@prisma/client';
import { HttpContext } from '../../types';

export async function handler(ctx: HttpContext): Promise<void> {
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
  const classFilter = query.get('class') || undefined;
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');

  console.log('[getSubmissionList] 查询参数:', {
    page,
    pageSize,
    lang,
    classFilter,
    startDate,
    endDate,
    memberId: ctx.user.memberId,
  });

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

  // 验证日期格式
  if (startDate && isNaN(Date.parse(startDate))) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid startDate format. Use ISO 8601 format (e.g., 2024-01-01)',
    };
    return;
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid endDate format. Use ISO 8601 format (e.g., 2024-12-31)',
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
      // 构建查询条件
      const whereCondition: any = {
        ownerId: ctx.user.memberId,
        YN: true,
        ...(classFilter && { Class: classFilter }),
      };

      // 添加时间范围过滤
      if (startDate || endDate) {
        const dateFilter: any = {};
        if (startDate) {
          dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          dateFilter.lte = endDateObj;
        }
        whereCondition.UploadTime = dateFilter;
      }

      console.log('[getSubmissionList] 查询条件 (HK):', JSON.stringify(whereCondition, null, 2));

      // 使用 c_userdata 表
      [submissions, totalCount] = await Promise.all([
        prisma.c_userdata.findMany({
          where: whereCondition,
          skip,
          take,
          orderBy: {
            id: 'desc',
          },
        }),
        prisma.c_userdata.count({
          where: whereCondition,
        }),
      ]);
    } else {
      // 构建查询条件
      const whereCondition: any = {
        ownerId: ctx.user.memberId,
        YN: true,
        ...(classFilter && { Class: classFilter }),
      };

      // 添加时间范围过滤
      if (startDate || endDate) {
        const dateFilter: any = {};
        if (startDate) {
          dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          dateFilter.lte = endDateObj;
        }
        whereCondition.UploadTime = dateFilter;
      }

      console.log('[getSubmissionList] 查询条件 (EN):', JSON.stringify(whereCondition, null, 2));

      // 使用 userdata 表（默认 en）
      [submissions, totalCount] = await Promise.all([
        prisma.userdata.findMany({
          where: whereCondition,
          skip,
          take,
          orderBy: {
            id: 'desc',
          },
        }),
        prisma.userdata.count({
          where: whereCondition,
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
