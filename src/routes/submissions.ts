/**
 * 作业提交相关路由
 */

import { prisma } from '../db/connection';
import { c_userdata } from '@prisma/client';
import { HttpContext } from '../types';
import { Prisma } from '@prisma/client';

/**
 * 分页参数接口
 */
interface PaginationParams {
  page?: number;
  pageSize?: number;
  lang?: 'en' | 'hk';
  class?: string;
}

/**
 * 班级月度趋势数据接口
 */
interface ClassMonthlyTrend {
  class: string;
  month: string; // 格式: YYYY-MM
  averageScore: number;
  count: number;
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
  const classFilter = query.get('class') || undefined;

  console.log('[getSubmissionList] 查询参数:', {
    page,
    pageSize,
    lang,
    classFilter,
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

  try {
    // 根据语言选择不同的表
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 构建基础查询条件
    const baseWhere = {
      ownerId: ctx.user.memberId,
      YN: true,
      ...(classFilter && { Class: classFilter }),
    };

    console.log('[getSubmissionList] 查询条件:', baseWhere);

    let submissions: c_userdata[];
    let totalCount: number;

    if (lang === 'hk') {
      // 使用 c_userdata 表
      [submissions, totalCount] = await Promise.all([
        prisma.c_userdata.findMany({
          where: baseWhere,
          skip,
          take,
          orderBy: {
            id: 'desc',
          },
        }),
        prisma.c_userdata.count({
          where: baseWhere,
        }),
      ]);
    } else {
      // 使用 userdata 表（默认 en）
      [submissions, totalCount] = await Promise.all([
        prisma.userdata.findMany({
          where: baseWhere,
          skip,
          take,
          orderBy: {
            id: 'desc',
          },
        }),
        prisma.userdata.count({
          where: baseWhere,
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

/**
 * 获取班级月度平均分趋势统计
 * 支持按时间段查询，支持英文和中文两种语言版本
 */
export async function getClassAverageScores(ctx: HttpContext): Promise<void> {
  if (!ctx.user) {
    ctx.status = 401;
    ctx.body = {
      error: 'Unauthorized',
    };
    return;
  }

  // 解析查询参数
  const query = ctx.req.query;
  const lang = (query.get('lang') || 'en') as 'en' | 'hk';
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');

  // 验证参数
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
    // 构建 SQL 查询的条件部分
    let timeCondition = '';
    if (startDate || endDate) {
      const conditions: string[] = [];
      if (startDate) {
        conditions.push(`UploadTime >= '${new Date(startDate).toISOString()}'`);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        conditions.push(`UploadTime <= '${endDateObj.toISOString()}'`);
      }
      timeCondition = 'AND ' + conditions.join(' AND ');
    }

    let results: ClassMonthlyTrend[];

    if (lang === 'hk') {
      // 使用 c_userdata 表（中文）
      const sqlQuery = Prisma.sql`
        SELECT
          COALESCE(Class, 'unknown') as class,
          FORMAT(UploadTime, 'yyyy-MM') as month,
          COUNT(*) as count,
          AVG(CAST(AverageScore AS FLOAT)) as avgScore
        FROM c_userdata
        WHERE
          ownerId = ${ctx.user.memberId}
          AND YN = 1
          AND AverageScore IS NOT NULL
          ${Prisma.raw(timeCondition)}
        GROUP BY COALESCE(Class, 'unknown'), FORMAT(UploadTime, 'yyyy-MM')
        ORDER BY class, month
      `;

      const rawData = await prisma.$queryRaw<
        Array<{ class: string | null; month: string; count: bigint; avgScore: number }>
      >(sqlQuery);

      results = rawData.map((item) => ({
        class: item.class || 'unknown',
        month: item.month,
        averageScore: item.avgScore || 0,
        count: Number(item.count),
      }));
    } else {
      // 使用 userdata 表（英文）
      const sqlQuery = Prisma.sql`
        SELECT
          COALESCE(Class, 'unknown') as class,
          FORMAT(UploadTime, 'yyyy-MM') as month,
          COUNT(*) as count,
          AVG(CAST(AverageScore AS FLOAT)) as avgScore
        FROM userdata
        WHERE
          ownerId = ${ctx.user.memberId}
          AND YN = 1
          AND AverageScore IS NOT NULL
          ${Prisma.raw(timeCondition)}
        GROUP BY COALESCE(Class, 'unknown'), FORMAT(UploadTime, 'yyyy-MM')
        ORDER BY class, month
      `;

      const rawData = await prisma.$queryRaw<
        Array<{ class: string | null; month: string; count: bigint; avgScore: number }>
      >(sqlQuery);

      results = rawData.map((item) => ({
        class: item.class || 'unknown',
        month: item.month,
        averageScore: item.avgScore || 0,
        count: Number(item.count),
      }));
    }

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: results,
      summary: {
        totalRecords: results.length,
        totalEssays: results.reduce((sum, item) => sum + item.count, 0),
        overallAverage: results.length > 0
          ? results.reduce((sum, item) => sum + item.averageScore * item.count, 0) /
            results.reduce((sum, item) => sum + item.count, 0)
          : 0,
      },
    };
  } catch (error) {
    console.error('Error fetching class monthly average scores:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
