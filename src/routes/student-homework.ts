/**
 * 学生作文相关路由
 */

import { teacherAssignment } from '@prisma/client';
import { prisma } from '../db/connection';
import { HttpContext } from '../types';

/**
 * 获取学生所有作业列表（包含中英文）
 * GET /api/student-homeworks?studentId={studentId}&startDate={startDate}&endDate={endDate}
 */
export async function getStudentHomeworks(ctx: HttpContext): Promise<void> {
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

    // 收集所有唯一的 homeworkId
    const homeworkIds = [...new Set(homeworkImages.map(img => img.homeworkId).filter(Boolean))];

    // 查询相关的 teacherAssignment 记录
    let teacherAssignments: any[] = [];
    if (homeworkIds.length > 0) {
      teacherAssignments = await prisma.teacherAssignment.findMany({
        where: {
          ID: {
            in: homeworkIds as string[]
          }
        },
        select: {
          ID: true,
          EssayTitle: true,
          EssayInstructions: true,
          EssayLanguage: true,
          TypeOfWriting: true,
          Subject: true,
          Deadline: true,
          CreatedDate: true,
          UpdatedDate: true,
        }
      });
    }

    // 创建 Map 以便快速查找
    const assignmentMap = new Map<string, teacherAssignment>(teacherAssignments.map(ta => [ta.ID, ta]));

    // 将 teacherAssignment 数据合并到 homeworkImages
    const result = homeworkImages.map(img => ({
      ...img,
      teacherAssignmentId: img.homeworkId,
      ...(assignmentMap.get(img.homeworkId || '') || {})
    }));

    // 如果没有作业，返回空列表
    if (result.length === 0) {
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: [],
        total: 0,
      };
      return;
    }

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: result,
      total: result.length,
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
