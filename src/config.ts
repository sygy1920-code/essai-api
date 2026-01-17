/**
 * 应用配置
 */

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
  // 数据库配置 (支持 Azure SQL / MySQL)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'essai',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    ssl: process.env.DB_SSL === 'true',
  },
};
