/**
 * 口语作业相关路由
 */

import { wixService } from '../services/wixService';
import { HttpContext } from '../types';
import { OralSpeechRecord } from '../types/oral-speech-record.types';
import { prisma } from '../db/connection';

/**
 * 获取口语作业列表（支持分页和多种过滤条件）
 * GET /api/oral-homeworks?page={page}&pageSize={pageSize}&oralQuestionId={oralQuestionId}&memberId={memberId}&mode={mode}&class={class}&language={language}&startDate={startDate}&endDate={endDate}
 *
 * 必需参数（至少一个）: oralQuestionId 或 memberId
 * 可选参数: page, pageSize, mode, class, language, startDate, endDate
 */
export async function getOralHomeworks(ctx: HttpContext): Promise<void> {
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
    // 从 Wix 获取口语作业数据
    const result = await wixService.getOralRecords({
      oralQuestionId: oralQuestionId || undefined,
      memberId: memberId || undefined,
      mode: mode || undefined,
      class: classValue || undefined,
      language: language || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      pageSize,
    });

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
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

/**
 * 获取教师口语作业列表（包含平均分）
 * GET /api/oral-homeworks/teacher?page={page}&pageSize={pageSize}&startDate={startDate}&endDate={endDate}&type={type}&language={language}
 */
export async function getTeacherOralHomeworks(ctx: HttpContext): Promise<void> {
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
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');
  const type = query.get('type');
  const language = query.get('language');
  const classValue = query.get('class');

  // 验证分页参数
  if (page < 1 || pageSize < 1 || pageSize > 100) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid pagination parameters',
    };
    return;
  }

  try {
    // 构建查询条件
    const whereCondition: any = {
      Owner: ctx.user.memberId,
      oralQuestionID: {
        not: null,
      },
      type: {
        notIn: [6, 7],
      },
    };

    // 添加 type 筛选
    if (type) {
      whereCondition.type = parseInt(type, 10);
    }

    // 添加 language 筛选
    if (language) {
      whereCondition.Language = language;
    }

    // 添加 class 筛选
    if (classValue) {
      whereCondition.Class = classValue;
    }

    // 添加时间筛选
    if (startDate || endDate) {
      whereCondition.CreatedDate = {};
      if (startDate) {
        whereCondition.CreatedDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereCondition.CreatedDate.lte = new Date(endDate);
      }
    }

    // 获取总数
    const total = await prisma.teacherAssignment.count({
      where: whereCondition,
    });

    // 从 Prisma 查询 teacherAssignment，获取 Owner=user.memberId 且包含 oralQuestionID 的记录
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: whereCondition,
      select: {
        ID: true,
        oralQuestionID: true,
        display_text: true,
        photo: true,
        description: true,
        Deadline: true,
        CreatedDate: true,
        UpdatedDate: true,
        Subject: true,
        Language: true,
        type: true,
        Class: true,
      },
      orderBy: {
        CreatedDate: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 收集所有 oralQuestionID
    const oralQuestionIds = teacherAssignments
      .map(ta => ta.oralQuestionID)
      .filter((id): id is string => id !== null);

    // 批量获取所有 oralQuestionID 的统计数据
    let statsMap = new Map<string, { averageScore: number; submissionCount: number }>();
    if (oralQuestionIds.length > 0) {
      try {
        statsMap = await wixService.getOralStatsByQuestionIds(oralQuestionIds);
      } catch (error) {
        console.error('Error fetching oral stats:', error);
      }
    }

    // 为每个 assignment 添加统计数据
    const oralHomeworksWithScores = teacherAssignments.map((assignment) => {
      if (!assignment.oralQuestionID) {
        return {
          ...assignment,
          averageScore: 0,
          submissionCount: 0,
        };
      }

      const stats = statsMap.get(assignment.oralQuestionID) || { averageScore: 0, submissionCount: 0 };

      return {
        ...assignment,
        averageScore: stats.averageScore,
        submissionCount: stats.submissionCount,
      };
    });

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: oralHomeworksWithScores,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error('Error fetching teacher oral homeworks:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
