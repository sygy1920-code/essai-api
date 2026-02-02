/**
 * 获取学生所有作业列表（包含中英文）
 * GET /student-homeworks
 *
 * 查询参数: studentId, startDate, endDate
 */

import { prisma } from '../../db/connection';
import { Prisma } from '@prisma/client';
import { HttpContext } from '../../types';

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

    // 批量获取所有 oralQuestionID 的统计数据（通过 Prisma）
    let statsMap = new Map<string, { averageScore: number; submissionCount: number }>();
    if (oralQuestionIds.length > 0) {
      try {
        // 使用 $queryRaw 直接查询 oralUsage 表，按 OralQuestionId 分组统计
        const statsResult = await prisma.$queryRaw<Array<{
          OralQuestionId: string;
          AverageScore: number;
          SubmissionCount: bigint;
        }>>`
          SELECT
            OralQuestionId,
            AVG(CAST(overallTotalScore AS FLOAT)) as AverageScore,
            COUNT(*) as SubmissionCount
          FROM oralUsage
          WHERE OralQuestionId IN (${Prisma.join(oralQuestionIds)})
          GROUP BY OralQuestionId
        `;

        // 初始化 statsMap，为所有请求的 ID 设置默认值
        for (const id of oralQuestionIds) {
          statsMap.set(id, { averageScore: 0, submissionCount: 0 });
        }

        // 填充统计数据
        for (const stat of statsResult) {
          statsMap.set(stat.OralQuestionId, {
            averageScore: stat.AverageScore || 0,
            submissionCount: Number(stat.SubmissionCount),
          });
        }
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
