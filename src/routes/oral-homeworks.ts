/**
 * 口语作业相关路由
 */

import { wixService } from '../services/wixService';
import { HttpContext } from '../types';
import { OralSpeechRecord } from '../types/oral-speech-record.types';

/**
 * 获取学生口语作业列表
 * GET /api/oral-homeworks?memberId={memberId}&startDate={startDate}&endDate={endDate}
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
  const memberId = query.get('memberId');
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');

  // 验证必需参数
  if (!memberId) {
    ctx.status = 400;
    ctx.body = {
      error: 'Missing required parameter: memberId',
    };
    return;
  }

  try {
    // 从 Wix 获取口语作业数据
    let oralRecords = await wixService.getOralByMember(memberId, startDate, endDate);

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      data: oralRecords,
      total: oralRecords.length,
      params: {
        memberId,
        startDate,
        endDate,
      },
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
