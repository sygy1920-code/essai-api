/**
 * 学生作文相关路由
 */

import { prisma } from '../db/connection';
import { HttpContext } from '../types';

/**
 * 作文内容接口
 */
interface EssayContent {
  originalText: string | null;
  revisedText: string | null;
  comments: string | null;
  title: string | null;
  pdfUrl: string | null;
  score: string | null;
}

/**
 * 作文数据接口
 */
interface EssayData {
  homeworkImagesId: number;
  studentHomeworkId: string | null;
  homeworkId: string | null;
  createdAt: string | null;
  attempt: number | null;
  essayLanguage: string | null;
  imageUrl: string | null;
  en: EssayContent;  // 英文作文内容
  cn: EssayContent;  // 中文作文内容
}

/**
 * 获取学生所有作文列表（包含中英文）
 * GET /api/student-essays?studentId={studentId}&startDate={startDate}&endDate={endDate}
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
  const studentId = query.get('studentId');
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');

  // 验证必需参数
  if (!studentId) {
    ctx.status = 400;
    ctx.body = {
      error: 'Missing required parameter: studentId',
    };
    return;
  }

  try {
    // 构建查询条件
    const whereCondition: any = {
      studentId: studentId,
    };

    // 添加时间筛选
    if (startDate || endDate) {
      whereCondition.createdAt = {};
      if (startDate) {
        // HomeworkImages.createdAt 是字符串类型 (YYYY-MM-DD HH:mm:ss)
        whereCondition.createdAt.gte = startDate;
      }
      if (endDate) {
        whereCondition.createdAt.lte = endDate;
      }
    }

    // 获取作业列表
    const homeworkImages = await prisma.homeworkImages.findMany({
      where: whereCondition,
      orderBy: {
        id: 'desc',
      },
    });

    // 如果没有作业，返回空列表
    if (homeworkImages.length === 0) {
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: [],
        total: 0,
      };
      return;
    }

    // 获取作业 ID 列表
    const homeworkIds = homeworkImages.map((hw) => hw.id);

    // 并行查询中英文作文内容
    const [enEssays, cnEssays] = await Promise.all([
      // 英文作文：从 imagedata_full 表查询
      prisma.imagedata_full.findMany({
        where: {
          homeworkimages_id: {
            in: homeworkIds,
          },
        },
        select: {
          id: true,
          homeworkimages_id: true,
          original_text: true,
          revised_text: true,
          relevancy_comment: true,
          title: true,
          pdf_url: true,
          score2: true,
        },
      }),

      // 中文作文：从 c_imagedata_full 表查询（使用原始 SQL 因为该表没有唯一标识符）
      // 构建安全的 SQL 查询，使用参数化
      prisma.$queryRaw<Array<{
        id: number;
        homeworkimages_id: number;
        original_text: string | null;
        revised_text: string | null;
        comments: string | null;
        title: string | null;
        pdf_url: string;
        score2: string | null;
      }>>`
        SELECT
          id,
          homeworkimages_id,
          original_text,
          revised_text,
          comments,
          title,
          pdf_url,
          score2
        FROM c_imagedata_full
        WHERE homeworkimages_id IN (${homeworkIds.join(',')})
      `,
    ]);

    // 创建映射以便快速查找
    const enEssayMap = new Map(
      enEssays.map((essay) => [
        essay.homeworkimages_id,
        {
          originalText: essay.original_text,
          revisedText: essay.revised_text,
          comments: essay.relevancy_comment,
          title: essay.title,
          pdfUrl: essay.pdf_url,
          score: essay.score2,
        },
      ])
    );

    const cnEssayMap = new Map(
      cnEssays.map((essay) => [
        essay.homeworkimages_id,
        {
          originalText: essay.original_text,
          revisedText: essay.revised_text,
          comments: essay.comments,
          title: essay.title,
          pdfUrl: essay.pdf_url,
          score: essay.score2,
        },
      ])
    );

    // 合并作业信息和作文内容
    const essays: EssayData[] = homeworkImages.map((hw) => {
      const enContent = enEssayMap.get(hw.id) || {
        originalText: null,
        revisedText: null,
        comments: null,
        title: null,
        pdfUrl: null,
        score: null,
      };

      const cnContent = cnEssayMap.get(hw.id) || {
        originalText: null,
        revisedText: null,
        comments: null,
        title: null,
        pdfUrl: null,
        score: null,
      };

      return {
        homeworkImagesId: hw.id,
        studentHomeworkId: hw.studentHomeworkId,
        homeworkId: hw.homeworkId,
        createdAt: hw.createdAt,
        attempt: hw.attempt,
        essayLanguage: hw.eaasy_language,
        imageUrl: hw.image_array ? hw.image_array.split(',')[0] : null,
        en: enContent,
        cn: cnContent,
      };
    });

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: essays,
      total: essays.length,
      params: {
        studentId,
        startDate,
        endDate,
      },
    };
  } catch (error) {
    console.error('Error fetching student essays:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
