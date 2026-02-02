/**
 * 路由定义
 */

import type { RouteConfig } from './types';

// Health
import { handler as health } from './health/index';

// Users
import { handler as getCurrentUser } from './users/me.get';
import { handler as getMyStudents } from './users/students.get';

// Submissions
import { handler as getSubmissionList } from './submissions/list.get';
import { handler as getClassAverageScores } from './submissions/class-summary.get';
import { handler as getClassMonthlyTrendsByClassNo } from './submissions/classno-summary.get';

// Students
import { handler as getStudentHomeworks } from './students/homeworks.get';
import { handler as getStudentEssays } from './students/essays.get';

// Oral
import { handler as getOralList } from './oral/list.get';
import { handler as getOralHomeworks } from './oral/homeworks.get';
import { handler as getOralClassSummary } from './oral/class-summary.get';
import { handler as getOralClassnoSummary } from './oral/classno-summary.get';
import { handler as updateOralData } from './oral/update.post';



export const routes: RouteConfig[] = [
  // 健康检查（无需认证）
  {
    method: 'GET',
    path: '/health',
    handler: health,
    requireAuth: false,
  },

  // 用户路由（需要认证）
  {
    method: 'GET',
    path: '/users/me',
    handler: getCurrentUser,
    requireAuth: true,
  },

  // 获取自己的学生列表（需要认证）
  {
    method: 'GET',
    path: '/users/students',
    handler: getMyStudents,
    requireAuth: true,
  },

  // 获取作业提交列表（需要认证，支持分页和多语言）
  {
    method: 'GET',
    path: '/submission/list',
    handler: getSubmissionList,
    requireAuth: true,
  },

  // 获取学生所有作业表（需要认证，支持时间筛选和多语言）
  {
    method: 'GET',
    path: '/student-homeworks',
    handler: getStudentHomeworks,
    requireAuth: true,
  },

  // 获取学生口语作业列表（需要认证，支持时间筛选）
  {
    method: 'GET',
    path: '/students/oral',
    handler: getOralList,
    requireAuth: true,
  },

  // 获取学生口语作业列表（需要认证，支持时间筛选）
  {
    method: 'GET',
    path: '/oral/homeworks',
    handler: getOralHomeworks,
    requireAuth: true,
  },

  // 获取oral得分趋势（需要认证，按班级聚合）
  {
    method: 'GET',
    path: '/oral/class-summary',
    handler: getOralClassSummary,
    requireAuth: true,
  },

  // 获取oral按班级和学生分组的统计汇总（需要认证，支持时间筛选）
  {
    method: 'GET',
    path: '/oral/classno-summary',
    handler: getOralClassnoSummary,
    requireAuth: true,
  },

  // 获取学生作文列表（需要认证，包含中英文作文）
  {
    method: 'GET',
    path: '/student/essays',
    handler: getStudentEssays,
    requireAuth: true,
  },

  // 获取各个班级的作文平均分统计（需要认证，支持时间筛选和多语言）
  {
    method: 'GET',
    path: '/submission/class-summary',
    handler: getClassAverageScores,
    requireAuth: true,
  },

  // 获取按 classno 分组的班级月度平均分趋势统计（需要认证，支持时间筛选和多语言）
  {
    method: 'GET',
    path: '/submission/classno-summary',
    handler: getClassMonthlyTrendsByClassNo,
    requireAuth: true,
  },

  // 更新 oralUsage / oralReport / MemberLookup 数据（需要认证）
  {
    method: 'POST',
    path: '/oral/update',
    handler: updateOralData,
    requireAuth: true,
  },
];

// Re-export types
export * from './types';
