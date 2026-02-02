/**
 * 获取班级月度平均分趋势统计
 * GET /submission/class-summary
 *
 * 支持按时间段查询，支持英文和中文两种语言版本
 * 注意：AverageScore 为 null 的记录会被视为 0 分参与计算
 */

import { prisma } from '../../db/connection';
import { HttpContext } from '../../types';
import { Prisma } from '@prisma/client';

/**
 * 班级月度趋势数据接口
 */
interface ClassMonthlyTrend {
  class: string;
  month: string; // 格式: YYYY-MM
  averageScore: number;
  count: number;
}

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
      // AverageScore 为 null 时视为 0
      const sqlQuery = Prisma.sql`
        SELECT
          UPPER(COALESCE(Class, 'unknown')) as class,
          FORMAT(UploadTime, 'yyyy-MM') as month,
          COUNT(*) as count,
          AVG(CAST(COALESCE(AverageScore, 0) AS FLOAT)) as avgScore
        FROM c_userdata
        WHERE
          ownerId = ${ctx.user.memberId}
          AND YN = 1
          ${Prisma.raw(timeCondition)}
        GROUP BY UPPER(COALESCE(Class, 'unknown')), FORMAT(UploadTime, 'yyyy-MM')
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
      // AverageScore 为 null 时视为 0
      const sqlQuery = Prisma.sql`
        SELECT
          UPPER(COALESCE(Class, 'unknown')) as class,
          FORMAT(UploadTime, 'yyyy-MM') as month,
          COUNT(*) as count,
          AVG(CAST(COALESCE(AverageScore, 0) AS FLOAT)) as avgScore
        FROM userdata
        WHERE
          ownerId = ${ctx.user.memberId}
          AND YN = 1
          ${Prisma.raw(timeCondition)}
        GROUP BY UPPER(COALESCE(Class, 'unknown')), FORMAT(UploadTime, 'yyyy-MM')
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
