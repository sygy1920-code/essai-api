/**
 * 获取按 classno 分组的班级月度平均分趋势统计
 * GET /submission/classno-summary
 *
 * 支持按时间段查询，支持英文和中文两种语言版本
 * 从 report_score 表获取学生得分数据
 * 最终结果根据 classno 从 wixService.getStudentsByTeacher 获取用户信息
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

import { prisma } from '../../db/connection';
import { HttpContext } from '../../types';
import { Prisma } from '@prisma/client';
import { Member, userService } from '../../services/userService';

/**
 * 按 classno 分组的月度趋势数据接口
 */
interface ClassNoMonthlyTrend {
  classno: number;
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
    // 并发获取学生数据和执行数据库查询
    console.log('[getClassMonthlyTrendsByClassNo] 开始并发获取学生数据和执行数据库查询...');

    // 将 classParam 转换为大写，确保比较一致性
    const classParamUpper = classParam.toUpperCase();

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

    // 并发执行：获取学生数据 + 查询数据库
    const [allStudents, results] = await Promise.all([
      userService.getStudentsByTeacher(ctx.user.email),
      (async () => {
        if (lang === 'hk') {
          // 使用 c_userdata、c_pdfdata、c_imagedata、c_imagedata_full、report_score_c 表（中文版本）
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
              AND UPPER(u.Class) = ${classParamUpper}
              AND r.total_score IS NOT NULL
              ${Prisma.raw(timeCondition)}
            GROUP BY COALESCE(r.classno, 0), FORMAT(u.UploadTime, 'yyyy-MM')
            ORDER BY classno, month
          `;

          const rawData = await prisma.$queryRaw<
            Array<{ classno: number | null; month: string; count: bigint; avgScore: number }>
          >(sqlQuery);

          return rawData.map((item) => ({
            classno: item.classno || 0,
            month: item.month,
            averageScore: item.avgScore || 0,
            count: Number(item.count),
          }));
        } else {
          // 使用 userdata、pdfdata、imagedata、imagedata_full、report_score 表（英文版本）
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
              AND UPPER(u.Class) = ${classParamUpper}
              AND r.total_score IS NOT NULL
              ${Prisma.raw(timeCondition)}
            GROUP BY COALESCE(r.classno, 0), FORMAT(u.UploadTime, 'yyyy-MM')
            ORDER BY classno, month
          `;

          const rawData = await prisma.$queryRaw<
            Array<{ classno: number | null; month: string; count: bigint; avgScore: number }>
          >(sqlQuery);

          return rawData.map((item) => ({
            classno: item.classno || 0,
            month: item.month,
            averageScore: item.avgScore || 0,
            count: Number(item.count),
          }));
        }
      })(),
    ]);

    console.log(`[getClassMonthlyTrendsByClassNo] 并发查询完成，获取到 ${allStudents.length} 名学生，${results.length} 条统计记录`);

    // 按 class + classno 组合键分组学生（使用大写确保匹配一致性）
    const studentsByClassAndClassno = new Map<string, Member>();
    for (const student of allStudents) {
      const classUpper = student.class.toUpperCase();
      studentsByClassAndClassno.set(`${classUpper}_${student.classno}`, student);
    }

    console.log(`[getClassMonthlyTrendsByClassNo] 学生按 class + classno 分组完成，共 ${JSON.stringify(studentsByClassAndClassno, null, 2)} 个分组`);

    console.log('[getClassMonthlyTrendsByClassNo] 查询结果:', {
      resultCount: results.length,
      totalEssays: results.reduce((sum, item) => sum + item.count, 0),
    });

    // 将学生信息关联到统计结果
    const resultsWithStudentCount = results.map((trend) => {
      // 使用 class + classno 组合键查找学生（使用大写）
      const key = `${classParamUpper}_${trend.classno}`;
      return {
        ...trend,
        student: studentsByClassAndClassno.get(key),
      };
    });

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: resultsWithStudentCount,
      summary: {
        totalRecords: results.length,
        totalEssays: results.reduce((sum, item) => sum + item.count, 0),
        overallAverage: results.length > 0
          ? results.reduce((sum, item) => sum + item.averageScore * item.count, 0) /
          results.reduce((sum, item) => sum + item.count, 0)
          : 0,
        totalStudents: allStudents.length,
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
