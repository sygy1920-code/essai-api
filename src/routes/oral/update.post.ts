 /**
 * 更新 oralUsage / oralReport / MemberLookup 数据
 * POST /oral/update
 *
 * 请求体:
 * {
 *   "oralUsage": { ... },  // 可选
 *   "oralReport": { ... }, // 可选
 *   "memberLookup": { ... } // 可选
 * }
 */

import { HttpContext } from '../../types';
import { prisma } from '../../db/connection';
import { Prisma } from '@prisma/client';

interface UpdateRequest {
  oralUsage?: Record<string, any>;
  oralReport?: Record<string, any>;
  memberLookup?: Record<string, any>;
}

export async function handler(ctx: HttpContext): Promise<void> {
  if (!ctx.user) {
    ctx.status = 401;
    ctx.body = {
      error: 'Unauthorized',
    };
    return;
  }

  try {
    // 解析请求体
    const body: UpdateRequest = await ctx.req.json() as UpdateRequest;

    const results: {
      oralUsage?: { success: boolean; message?: string; id?: string };
      oralReport?: { success: boolean; message?: string; id?: string };
      memberLookup?: { success: boolean; message?: string; id?: string };
    } = {};

    // 更新 oralUsage 表（使用原始 SQL，因为表被标记为 @@ignore）
    if (body.oralUsage) {
      try {
        const data = body.oralUsage;
        const id = data.ID || data.id;

        if (!id) {
          results.oralUsage = { success: false, message: 'ID is required for oralUsage' };
        } else {
          // 检查记录是否存在
          const existing = await prisma.$queryRaw<any[]>`
            SELECT ID FROM oralUsage WHERE ID = ${id}
          `;

          if (existing.length === 0) {
            // 插入新记录
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `@p${i}`).join(', ');

            const insertSql = `
              INSERT INTO oralUsage (${columns.join(', ')})
              VALUES (${placeholders})
            `;

            await prisma.$executeRawUnsafe(
              insertSql,
              ...values
            );
            results.oralUsage = { success: true, message: 'Created', id };
          } else {
            // 更新现有记录
            const updates = Object.entries(data)
              .filter(([key]) => key !== 'ID' && key !== 'id')
              .map(([key, _], i) => `${key} = @p${i}`)
              .join(', ');

            const values = Object.entries(data)
              .filter(([key]) => key !== 'ID' && key !== 'id')
              .map(([_, value]) => value);

            const updateSql = `
              UPDATE oralUsage
              SET ${updates}, Updated_Date = GETUTCDATE()
              WHERE ID = @p${values.length}
            `;

            await prisma.$executeRawUnsafe(
              updateSql,
              ...values,
              id
            );
            results.oralUsage = { success: true, message: 'Updated', id };
          }
        }
      } catch (error) {
        console.error('Error updating oralUsage:', error);
        results.oralUsage = {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // 更新 oralReport 表
    if (body.oralReport) {
      try {
        const data = body.oralReport;
        const id = data.ID || data.id;

        if (!id) {
          results.oralReport = { success: false, message: 'ID is required for oralReport' };
        } else {
          // 检查记录是否存在
          const existing = await prisma.$queryRaw<any[]>`
            SELECT ID FROM oralReport WHERE ID = ${id}
          `;

          if (existing.length === 0) {
            // 插入新记录
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `@p${i}`).join(', ');

            const insertSql = `
              INSERT INTO oralReport (${columns.join(', ')})
              VALUES (${placeholders})
            `;

            await prisma.$executeRawUnsafe(
              insertSql,
              ...values
            );
            results.oralReport = { success: true, message: 'Created', id };
          } else {
            // 更新现有记录
            const updates = Object.entries(data)
              .filter(([key]) => key !== 'ID' && key !== 'id')
              .map(([key, _], i) => `${key} = @p${i}`)
              .join(', ');

            const values = Object.entries(data)
              .filter(([key]) => key !== 'ID' && key !== 'id')
              .map(([_, value]) => value);

            const updateSql = `
              UPDATE oralReport
              SET ${updates}, Updated_Date = GETUTCDATE()
              WHERE ID = @p${values.length}
            `;

            await prisma.$executeRawUnsafe(
              updateSql,
              ...values,
              id
            );
            results.oralReport = { success: true, message: 'Updated', id };
          }
        }
      } catch (error) {
        console.error('Error updating oralReport:', error);
        results.oralReport = {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // 更新 MemberLookup 表（使用原始 SQL，因为需要安全更新）
    if (body.memberLookup) {
      try {
        const data = body.memberLookup;
        const id = data.ID || data.id;

        if (!id) {
          results.memberLookup = { success: false, message: 'ID is required for memberLookup' };
        } else {
          // 检查记录是否存在
          const existing = await prisma.$queryRaw<any[]>`
            SELECT ID FROM MemberLookup WHERE ID = ${id}
          `;

          if (existing.length === 0) {
            // 插入新记录
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `@p${i}`).join(', ');

            const insertSql = `
              INSERT INTO MemberLookup (${columns.join(', ')})
              VALUES (${placeholders})
            `;

            await prisma.$executeRawUnsafe(
              insertSql,
              ...values
            );
            results.memberLookup = { success: true, message: 'Created', id };
          } else {
            // 更新现有记录
            const updates = Object.entries(data)
              .filter(([key]) => key !== 'ID' && key !== 'id')
              .map(([key, _], i) => `${key} = @p${i}`)
              .join(', ');

            const values = Object.entries(data)
              .filter(([key]) => key !== 'ID' && key !== 'id')
              .map(([_, value]) => value);

            const updateSql = `
              UPDATE MemberLookup
              SET ${updates}, Updated_Date = FORMAT(GETUTCDATE(), 'yyyy-MM-dd HH:mm:ss')
              WHERE ID = @p${values.length}
            `;

            await prisma.$executeRawUnsafe(
              updateSql,
              ...values,
              id
            );
            results.memberLookup = { success: true, message: 'Updated', id };
          }
        }
      } catch (error) {
        console.error('Error updating memberLookup:', error);
        results.memberLookup = {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Error in oral update handler:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
