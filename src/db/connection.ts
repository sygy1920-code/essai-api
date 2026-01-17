/**
 * 数据库连接模块 - Prisma Client
 * 支持 Azure SQL (Prisma 7 with mssql adapter)
 *
 * Prisma 7 变更：
 * - 使用 driver adapter (node-mssql)
 * - 不再在 schema 中配置 DATABASE_URL
 * - 通过 adapter 配置对象传递数据库连接参数
 */

import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import * as mssql from 'mssql';
import { config } from '../config';

// 声明 Prisma Client 扩展类型
declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | PrismaClient;
}

/**
 * Prisma Client 单例
 * 在开发环境中使用热重载，在生产环境中创建单个实例
 */
function createPrismaClient(): PrismaClient {
  // 创建 mssql 连接配置
  const mssqlConfig: mssql.config = {
    server: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    options: {
      encrypt: config.database.ssl,
      trustServerCertificate: config.database.ssl,
      enableArithAbort: true,
    },
    pool: {
      max: config.database.connectionLimit,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  // 创建 Prisma adapter（直接传入配置对象）
  const adapter = new PrismaMssql(mssqlConfig);

  // 创建 Prisma Client 并传入 adapter
  return new PrismaClient({
    adapter,
    log: config.app.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * 获取 Prisma Client 实例
 */
export function getPrismaClient(): PrismaClient {
  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }
  return global.prisma;
}

/**
 * 导出 prisma 实例供使用
 */
export const prisma = getPrismaClient();

/**
 * 执行原始 SQL 查询
 * @param query SQL 查询语句
 * @param parameters 查询参数
 * @returns 查询结果
 */
export async function query<T = any>(query: string, parameters?: any[]): Promise<T[]> {
  return prisma.$queryRawUnsafe(query, ...(parameters || [])) as Promise<T[]>;
}

/**
 * 执行原始 SQL 命令 (INSERT, UPDATE, DELETE 等)
 * @param command SQL 命令
 * @param parameters 命令参数
 * @returns 执行结果
 */
export async function execute(command: string, parameters?: any[]): Promise<number> {
  return prisma.$executeRawUnsafe(command, ...(parameters || []));
}

/**
 * 检查数据库连接
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

/**
 * 断开数据库连接
 */
export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
  if (global.prisma) {
    global.prisma = undefined;
  }
}

/**
 * 处理进程退出时的连接清理
 */
process.on('beforeExit', async () => {
  await disconnect();
});

process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});
