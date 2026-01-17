/**
 * 数据库连接模块
 * 支持 Azure SQL / MySQL 连接
 */

import mysql from 'mysql2/promise';
import { config } from '../config';

let pool: mysql.Pool | null = null;

/**
 * 获取数据库连接池
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: config.database.connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Azure SQL 需要的额外配置
      ssl: config.database.ssl ? {
        rejectUnauthorized: false
      } : undefined,
    });

    // 监听连接事件
    pool.on('connection', (connection) => {
      console.log('Database connection established');
    });

    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }

  return pool;
}

/**
 * 执行查询
 * @param sql SQL 语句
 * @param params 参数
 * @returns 查询结果
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

/**
 * 执行插入操作
 * @param sql SQL 语句
 * @param params 参数
 * @returns 插入结果
 */
export async function insert(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

/**
 * 执行更新操作
 * @param sql SQL 语句
 * @param params 参数
 * @returns 更新结果
 */
export async function update(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

/**
 * 执行删除操作
 * @param sql SQL 语句
 * @param params 参数
 * @returns 删除结果
 */
export async function remove(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

/**
 * 开始事务
 * @returns 连接对象
 */
export async function beginTransaction(): Promise<mysql.PoolConnection> {
  const pool = getPool();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * 提交事务
 * @param connection 连接对象
 */
export async function commit(connection: mysql.PoolConnection): Promise<void> {
  await connection.commit();
  connection.release();
}

/**
 * 回滚事务
 * @param connection 连接对象
 */
export async function rollback(connection: mysql.PoolConnection): Promise<void> {
  await connection.rollback();
  connection.release();
}

/**
 * 关闭数据库连接池
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * 检查数据库连接
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
