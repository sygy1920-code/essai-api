/**
 * 应用配置
 */

/**
 * 构建 Azure SQL 连接字符串
 * 优先使用 DATABASE_URL，如果不存在则从单独的环境变量构建
 *
 * Prisma SQL Server 使用 JDBC 标准连接字符串格式:
 * sqlserver://HOST[:PORT];database=DATABASE;user=USER;password=PASSWORD;encrypt=true;trustServerCertificate=true
 */
function buildDatabaseUrl(): string {
  // 如果已经存在 DATABASE_URL，直接使用
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // 从环境变量或 local.settings.json 构建连接字符串
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '1433';
  const user = process.env.DB_USER || 'sa';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'essai';

  // Prisma SQL Server 使用 JDBC 标准连接字符串格式
  // 格式: sqlserver://HOST[:PORT];database=DATABASE;user=USER;password=PASSWORD;encrypt=true;trustServerCertificate=true
  let connectionString = `sqlserver://${host}:${port};database=${database};user=${user};password=${password}`;

  // 添加 SSL 参数
  if (process.env.DB_SSL === 'true') {
    connectionString += ';encrypt=true;trustServerCertificate=true';
  }

  return connectionString;
}

export const config = {
  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  // 应用配置
  app: {
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  // 数据库配置
  database: {
    url: buildDatabaseUrl(),
    // 单独的数据库参数 (用于日志或调试)
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'essai',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    ssl: process.env.DB_SSL === 'true',
  },
};
