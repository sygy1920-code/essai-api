/**
 * 学生作文相关路由
 */

import { prisma } from '../db/connection';
import { HttpContext } from '../types';
import type {
  GetStudentEssaysParams,
  StudentEssaysResponse,
} from '../types/student-essays.types';
import { Prisma } from '@prisma/client';

/**
 * 获取学生作文列表（包含英文和中文作文）
 * GET /api/student-essays?member_id={member_id}&school={school}&schoolclass={schoolclass}&classno={classno}&start_date={start_date}&end_date={end_date}
 *
 * 支持时间段筛选：
 * - start_date: 开始日期，ISO 8601 格式，例如: "2024-01-01"
 * - end_date: 结束日期，ISO 8601 格式，例如: "2024-12-31"
 */
export async function getStudentEssays(ctx: HttpContext): Promise<void> {
  if (!ctx.user) {
    ctx.status = 401;
    ctx.body = {
      error: 'Unauthorized',
    };
    return;
  }

  // 解析查询参数
  const query = ctx.req.query;
  const member_id = query.get('member_id');
  const school = query.get('school');
  const schoolclass = query.get('schoolclass');
  const classno = query.get('classno');
  const start_date = query.get('start_date');
  const end_date = query.get('end_date');

  // 验证必需参数
  if (!member_id || !school || !schoolclass || !classno) {
    ctx.status = 400;
    ctx.body = {
      error: 'Missing required parameters: member_id, school, schoolclass, classno',
    };
    return;
  }

  try {
    // 处理日期参数
    const startDate = start_date ? new Date(start_date) : null;
    const endDate = end_date ? new Date(end_date) : null;

    // 将结束日期设置为当天的 23:59:59，以包含当天的所有数据
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    // 构建查询条件数组
    const conditions = [
      Prisma.sql`school = ${school}`,
      Prisma.sql`schoolclass = ${schoolclass}`,
      Prisma.sql`classno = ${parseInt(classno)}`,
    ];

    // if (startDate) {
    //   conditions.push(Prisma.sql`inserted_at >= ${startDate}`);
    // }

    // if (endDate) {
    //   conditions.push(Prisma.sql`inserted_at <= ${endDate}`);
    // }

    // 组合 WHERE 条件
    const whereClause = conditions.reduce(
      (acc, condition, index) =>
        index === 0
          ? Prisma.sql`WHERE ${condition}`
          : Prisma.sql`${acc} AND ${condition}`,
      Prisma.empty
    );

    // 并行查询英文作文评分和中文作文评分
    // 注意: report_score 表有 @@ignore，所以使用原始 SQL
    // report_score_c 可以使用 Prisma Model
    const [englishScores, chineseScores] = await Promise.all([
      // 查询英文作文评分（使用安全的 $queryRaw 模板字符串）
      prisma.$queryRaw<Array<any>>`
        SELECT
          id,
          score2,
          total_score,
          total_score_max,
          content_score,
          content_score_max,
          language_score,
          language_score_max,
          grammar_score,
          grammar_score_max,
          organization_score,
          organization_score_max,
          word_count_score,
          word_count_score_max,
          strengths,
          weaknesses,
          school,
          schoolclass,
          classno,
          image_url,
          pdf_url,
          report_url,
          misspelling,
          inserted_at
        FROM report_score
        ${whereClause}
        ORDER BY inserted_at DESC
      `,
      // 查询中文作文评分（使用 Model）
      prisma.report_score_c.findMany({
        where: {
          school: school,
          schoolclass: schoolclass,
          classno: parseInt(classno),
          ...(startDate || endDate ? {
            inserted_at: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          } : {}),
        },
        orderBy: {
          inserted_at: 'desc',
        },
      }),
    ]);

    // 提取英文作文ID列表
    const englishIds = englishScores.map((item: any) => item.id);
    // 提取中文作文ID列表
    const chineseIds = chineseScores.map((item) => item.id);

    // 并行查询英文作文详情和中文作文详情
    // 注意: c_imagedata_full 有 @@ignore，所以使用原始 SQL
    // imagedata_full 可以使用 Prisma Model
    const [englishDetails, chineseDetails] = await Promise.all([
      // 查询英文作文详情（使用 Model）
      englishIds.length > 0
        ? prisma.imagedata_full.findMany({
            where: {
              id: {
                in: englishIds,
              },
            },
          })
        : Promise.resolve([]),
      // 查询中文作文详情
      chineseIds.length > 0
        ? prisma.$queryRaw<Array<any>>`
          SELECT
            id,
            original_text,
            revised_text,
            revised_text2,
            revised_text3,
            wordcount_comment,
            title,
            relevancy,
            relevancy_comment,
            studentshare_yn,
            score2_user,
            revised_text3_user,
            relevancy_comment_user
          FROM c_imagedata_full
          WHERE id IN (${chineseIds.join(',')})
        `
        : Promise.resolve([]),
    ]);

    // 创建英文作文详情的 Map，用于快速查找
    const englishDetailsMap = new Map(englishDetails.map((detail: any) => [detail.id, detail]));
    // 创建中文作文详情的 Map，用于快速查找
    const chineseDetailsMap = new Map(chineseDetails.map((detail: any) => [detail.id, detail]));

    // 合并英文作文评分和详情
    const englishEssays = englishScores.map((score: any) => {
      const detail = englishDetailsMap.get(score.id);
      return {
        ...score,
        ...(detail || {}),
        language: 'english',
        language_type: 'en',
      };
    });

    // 合并中文作文评分和详情
    const chineseEssays = chineseScores.map((score: any) => {
      const detail = chineseDetailsMap.get(score.id);
      return {
        ...score,
        ...(detail || {}),
        language: 'chinese',
        language_type: 'zh',
      };
    });

    // 合并并按时间排序
    const allEssays = [...englishEssays, ...chineseEssays].sort((a, b) => {
      const dateA = new Date(a.inserted_at).getTime();
      const dateB = new Date(b.inserted_at).getTime();
      return dateB - dateA;
    });

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: allEssays,
      total: allEssays.length,
      summary: {
        english_count: englishEssays.length,
        chinese_count: chineseEssays.length,
      },
      params: {
        member_id,
        school,
        schoolclass,
        classno,
        start_date,
        end_date,
      } as GetStudentEssaysParams,
    } as StudentEssaysResponse;
  } catch (error) {
    console.error('Error fetching student essays:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    } as StudentEssaysResponse;
  }
}
