/**
 * 获取学生口语作业列表（支持分页和多种过滤条件）
 * GET /oral/list
 *
 * 必需参数（至少一个）: oralQuestionId 或 memberId
 * 可选参数: page, pageSize, mode, class, language, startDate, endDate
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
  const oralQuestionId = query.get('oralQuestionId');
  const memberId = query.get('memberId');
  const mode = query.get('mode');
  const classValue = query.get('class');
  const language = query.get('language');
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');
  const page = parseInt(query.get('page') || '1', 10);
  const pageSize = parseInt(query.get('pageSize') || '10', 10);

  // 验证必需参数（至少需要 oralQuestionId 或 memberId）
  if (!oralQuestionId && !memberId) {
    ctx.status = 400;
    ctx.body = {
      error: 'At least one of oralQuestionId or memberId must be provided',
    };
    return;
  }

  // 验证分页参数
  if (page < 1 || pageSize < 1 || pageSize > 100) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid pagination parameters. Page must be >= 1, pageSize must be between 1 and 100',
    };
    return;
  }

  try {
    const conditions: (Prisma.Sql | string)[] = [];

    // Apply required filter (oralQuestionId or memberId)
    if (oralQuestionId) {
      conditions.push(Prisma.sql`OralQuestionId = ${oralQuestionId}`);
    } else if (memberId) {
      conditions.push(Prisma.sql`memberId = ${memberId}`);
    }

    // Apply optional filters
    if (mode) {
      conditions.push(Prisma.sql`mode = ${mode}`);
    }
    if (classValue) {
      conditions.push(Prisma.sql`class = ${classValue}`);
    }
    if (language) {
      conditions.push(Prisma.sql`language = ${language}`);
    }

    // Apply date range filters
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

    // Get total count
    const countResult = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(*) as total
      FROM oralUsage
      ${whereClause}
    `;
    const total = Number(countResult[0].total);

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const totalPages = Math.ceil(total / pageSize);

    // Apply pagination and fetch data
    const result = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM oralUsage
      ${whereClause}
      ORDER BY createDate DESC
      OFFSET ${skip} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY
    `;

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: result,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching oral homeworks:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
