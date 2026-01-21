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
 * 按 classno 分组的月度趋势数据接口
 */
interface ClassNoMonthlyTrend {
  classno: number;
  month: string; // 格式: YYYY-MM
  averageScore: number;
  count: number;
}

/**
 * 获取全部作业列表（支持分页和多语言）
 *
 * 查询参数:
 * - page: 页码，默认 1
 * - pageSize: 每页数量，默认 10，最大 100
 * - lang: 语言版本 (en/hk)，默认 en
 * - class: 班级名称（可选）
 * - startDate: 开始日期（可选），ISO 8601 格式
 * - endDate: 结束日期（可选），ISO 8601 格式
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

/**
 * 获取班级月度平均分趋势统计
 * 支持按时间段查询，支持英文和中文两种语言版本
 *
 * 注意：AverageScore 为 null 的记录会被视为 0 分参与计算
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
      // AverageScore 为 null 时视为 0
      const sqlQuery = Prisma.sql`
        SELECT
          COALESCE(Class, 'unknown') as class,
          FORMAT(UploadTime, 'yyyy-MM') as month,
          COUNT(*) as count,
          AVG(CAST(COALESCE(AverageScore, 0) AS FLOAT)) as avgScore
        FROM c_userdata
        WHERE
          ownerId = ${ctx.user.memberId}
          AND YN = 1
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
      // AverageScore 为 null 时视为 0
      const sqlQuery = Prisma.sql`
        SELECT
          COALESCE(Class, 'unknown') as class,
          FORMAT(UploadTime, 'yyyy-MM') as month,
          COUNT(*) as count,
          AVG(CAST(COALESCE(AverageScore, 0) AS FLOAT)) as avgScore
        FROM userdata
        WHERE
          ownerId = ${ctx.user.memberId}
          AND YN = 1
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

/**
 * 获取按 classno 分组的班级月度平均分趋势统计
 * 支持按时间段查询，支持英文和中文两种语言版本
 * 从 report_score 表获取学生得分数据
 *
 * 关联链路:
 * - 英文版: userdata → pdfdata → imagedata → imagedata_full → report_score
 * - 中文版: c_userdata → c_pdfdata → c_imagedata → c_imagedata_full → report_score_c
 *
 * 查询参数:
 * - lang: 语言版本 (en/hk)，默认 en
 * - class: 班级名称（必填）
 * - startDate: 开始日期（可选），ISO 8601 格式
 * - endDate: 结束日期（可选），ISO 8601 格式
 */
export async function getClassMonthlyTrendsByClassNo(ctx: HttpContext): Promise<void> {
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
  const classParam = query.get('class');
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');

  console.log('[getClassMonthlyTrendsByClassNo] 查询参数:', {
    lang,
    class: classParam,
    startDate,
    endDate,
    memberId: ctx.user.memberId,
  });

  // 验证必填参数
  if (!classParam) {
    ctx.status = 400;
    ctx.body = {
      error: 'Missing required parameter: class',
    };
    return;
  }

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
        conditions.push(`u.UploadTime >= '${new Date(startDate).toISOString()}'`);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        conditions.push(`u.UploadTime <= '${endDateObj.toISOString()}'`);
      }
      timeCondition = 'AND ' + conditions.join(' AND ');
    }

    let results: ClassNoMonthlyTrend[];

    if (lang === 'hk') {
      // 使用 c_userdata、c_pdfdata、c_imagedata、c_imagedata_full、report_score_c 表（中文版本）
      // 关联链路: c_userdata → c_pdfdata → c_imagedata → c_imagedata_full → report_score_c
      // 按 report_score_c.classno 分组
      const sqlQuery = Prisma.sql`
        SELECT
          COALESCE(r.classno, 0) as classno,
          FORMAT(u.UploadTime, 'yyyy-MM') as month,
          COUNT(*) as count,
          AVG(CAST(r.total_score AS FLOAT)) as avgScore
        FROM c_userdata u
        INNER JOIN c_pdfdata a ON u.id = a.userdata_id
        INNER JOIN c_imagedata d ON a.id = d.pdfdata_id
        INNER JOIN c_imagedata_full b ON d.id = b.id
        INNER JOIN report_score_c r ON b.id = r.id
        WHERE
          u.ownerId = ${ctx.user.memberId}
          AND u.YN = 1
          AND u.Class = ${classParam}
          AND r.total_score IS NOT NULL
          ${Prisma.raw(timeCondition)}
        GROUP BY COALESCE(r.classno, 0), FORMAT(u.UploadTime, 'yyyy-MM')
        ORDER BY classno, month
      `;

      const rawData = await prisma.$queryRaw<
        Array<{ classno: number | null; month: string; count: bigint; avgScore: number }>
      >(sqlQuery);

      results = rawData.map((item) => ({
        classno: item.classno || 0,
        month: item.month,
        averageScore: item.avgScore || 0,
        count: Number(item.count),
      }));
    } else {
      // 使用 userdata、pdfdata、imagedata、imagedata_full、report_score 表（英文版本）
      // 关联链路: userdata → pdfdata → imagedata → imagedata_full → report_score
      // 按 report_score.classno 分组
      const sqlQuery = Prisma.sql`
        SELECT
          COALESCE(r.classno, 0) as classno,
          FORMAT(u.UploadTime, 'yyyy-MM') as month,
          COUNT(*) as count,
          AVG(CAST(r.total_score AS FLOAT)) as avgScore
        FROM userdata u
        INNER JOIN pdfdata a ON u.id = a.userdata_id
        INNER JOIN imagedata d ON a.id = d.pdfdata_id
        INNER JOIN imagedata_full b ON d.id = b.id
        INNER JOIN report_score r ON b.id = r.id
        WHERE
          u.ownerId = ${ctx.user.memberId}
          AND u.YN = 1
          AND u.Class = ${classParam}
          AND r.total_score IS NOT NULL
          ${Prisma.raw(timeCondition)}
        GROUP BY COALESCE(r.classno, 0), FORMAT(u.UploadTime, 'yyyy-MM')
        ORDER BY classno, month
      `;

      const rawData = await prisma.$queryRaw<
        Array<{ classno: number | null; month: string; count: bigint; avgScore: number }>
      >(sqlQuery);

      results = rawData.map((item) => ({
        classno: item.classno || 0,
        month: item.month,
        averageScore: item.avgScore || 0,
        count: Number(item.count),
      }));
    }

    console.log('[getClassMonthlyTrendsByClassNo] 查询结果:', {
      resultCount: results.length,
      totalEssays: results.reduce((sum, item) => sum + item.count, 0),
    });

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
    console.error('Error fetching class monthly trends by classno:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
