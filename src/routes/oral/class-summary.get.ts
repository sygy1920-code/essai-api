/**
 * 获取oral得分趋势（按班级聚合）
 * GET /oral/class-summary
 */

import { HttpContext } from '../../types';
import { prisma } from '../../db/connection';
import { Prisma } from '@prisma/client';

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
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');
  const language = query.get('language');

  try {
    const classes = ctx.user.class ? ctx.user.class.split(',').map((c: string) => c.trim()).filter((c: string) => c) : [];

    if (classes.length === 0) {
      ctx.status = 400;
      ctx.body = {
        error: 'No classes found for the user',
      };
      return;
    }

    // Build conditions for WHERE clause
    const conditions: (Prisma.Sql | string)[] = [];

    if (ctx.user.school) {
      conditions.push(Prisma.sql`school = ${ctx.user.school}`);
    }

    if (classes && classes.length > 0) {
      conditions.push(Prisma.sql`class IN (${Prisma.join(classes)})`);
    }

    if (language) {
      conditions.push(Prisma.sql`language = ${language}`);
    }

    const startDateFilter = startDate ? new Date(startDate) : null;
    const endDateFilter = endDate ? new Date(endDate) : null;

    if (startDateFilter) {
      conditions.push(Prisma.sql`createDate >= ${startDateFilter}`);
    }

    if (endDateFilter) {
      conditions.push(Prisma.sql`createDate <= ${endDateFilter}`);
    }

    // Build WHERE clause
    let whereClause: Prisma.Sql | string = '';
    if (conditions.length > 0) {
      whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
    }

    // Use aggregate to group by class and month, get count + average score
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        class as class,
        FORMAT(createDate, 'yyyy-MM') as month,
        COUNT(*) as count,
        AVG(overallTotalScore) as averageScore
      FROM oralUsage
      ${whereClause}
      GROUP BY class, FORMAT(createDate, 'yyyy-MM')
      ORDER BY month, class
    `;

    console.log('Oral score trends aggregate result:', result);

    // Process aggregate results
    const trends: Array<{
      class: string;
      month: string;
      count: number;
      averageScore: number;
    }> = [];

    for (const item of result) {
      const classValue = item.class as string;
      const month = item.month as string;
      const count = item.count as number;
      const averageScore = item.averageScore as number || 0;

      trends.push({
        class: classValue,
        month,
        count,
        averageScore,
      });
    }

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: trends,
    };
  } catch (error) {
    console.error('Error fetching oral score trends:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
