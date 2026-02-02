/**
 * 获取oral按班级、月份和学生分组的统计汇总
 * GET /oral/classno-summary
 *
 * 支持按班级筛选、按memberId分组、按月份分组、时间筛选、语言筛选
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
  const classParam = query.get('class');
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');
  const language = query.get('language');

  try {
    // 获取用户有权限的班级
    const classes = ctx.user.class ? ctx.user.class.split(',').map((c: string) => c.trim()).filter((c: string) => c) : [];

    if (classes.length === 0) {
      ctx.status = 400;
      ctx.body = {
        error: 'No classes found for the user',
      };
      return;
    }

    // 如果指定了班级，验证用户是否有权限访问该班级
    let targetClasses = classes;
    if (classParam) {
      if (!classes.includes(classParam)) {
        ctx.status = 403;
        ctx.body = {
          error: 'Access denied to the specified class',
        };
        return;
      }
      targetClasses = [classParam];
    }

    // Build conditions for WHERE clause
    const conditions: (Prisma.Sql | string)[] = [];

    if (ctx.user.school) {
      conditions.push(Prisma.sql`school = ${ctx.user.school}`);
    }

    if (targetClasses && targetClasses.length > 0) {
      conditions.push(Prisma.sql`class IN (${Prisma.join(targetClasses)})`);
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

    // Aggregate by class, month, classno, and memberId
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        class as class,
        FORMAT(createDate, 'yyyy-MM') as month,
        classno as classno,
        memberId as memberId,
        fullName as fullName,
        email as email,
        COUNT(*) as count,
        AVG(overallTotalScore) as averageScore
      FROM oralUsage
      ${whereClause}
      GROUP BY class, FORMAT(createDate, 'yyyy-MM'), classno, memberId, fullName, email
      ORDER BY class, month, classno, memberId
    `;

    console.log('Oral classno-summary aggregate result:', result);

    // Process aggregate results
    const summary: Array<{
      class: string;
      month: string;
      classno: number | null;
      memberId: string | null;
      fullName: string | null;
      email: string | null;
      count: number;
      averageScore: number;
    }> = [];

    for (const item of result) {
      summary.push({
        class: item.class as string,
        month: item.month as string,
        classno: item.classno as number | null,
        memberId: item.memberId as string | null,
        fullName: item.fullName as string | null,
        email: item.email as string | null,
        count: item.count as number,
        averageScore: item.averageScore as number || 0,
      });
    }

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: summary,
    };
  } catch (error) {
    console.error('Error fetching oral classno summary:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
