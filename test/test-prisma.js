/**
 * Prisma 7 连接测试脚本 (使用 mssql adapter)
 */

// 加载环境变量
require('dotenv').config();

async function testPrisma() {
  try {
    console.log('=== Prisma 7 Connection Test (with mssql adapter) ===\n');

    // 检查环境变量
    console.log('1. Checking environment variables...');
    console.log('   DB_HOST:', process.env.DB_HOST ? '✅ Set' : '❌ Not set');
    console.log('   DB_PORT:', process.env.DB_PORT ? '✅ Set' : '❌ Not set');
    console.log('   DB_USER:', process.env.DB_USER ? '✅ Set' : '❌ Not set');
    console.log('   DB_NAME:', process.env.DB_NAME ? '✅ Set' : '❌ Not set');

    const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = requiredEnvVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.log('\n❌ Missing environment variables:', missing.join(', '));
      process.exit(1);
    }

    // 导入模块
    console.log('\n2. Loading modules...');
    const { PrismaClient } = require('@prisma/client');
    const { PrismaMssql } = require('@prisma/adapter-mssql');
    const mssql = require('mssql');
    console.log('   ✅ Modules loaded');

    // 创建 mssql 配置
    console.log('\n3. Creating mssql configuration...');
    const mssqlConfig = {
      server: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: process.env.DB_SSL === 'true',
        trustServerCertificate: process.env.DB_SSL === 'true',
        enableArithAbort: true,
      },
      pool: {
        max: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
    console.log('   ✅ Configuration created');
    console.log('   Server:', mssqlConfig.server);
    console.log('   Database:', mssqlConfig.database);

    // 创建 adapter（直接传入配置对象）
    console.log('\n4. Creating Prisma adapter...');
    const adapter = new PrismaMssql(mssqlConfig);
    console.log('   ✅ Adapter created');

    // 创建 Prisma Client 实例
    console.log('\n5. Creating Prisma Client instance...');
    const prisma = new PrismaClient({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
    console.log('   ✅ Prisma Client instance created');

    // 测试连接
    console.log('\n6. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Connected to database');

    // 显示可用的模型
    console.log('\n7. Available models:');
    const models = Object.keys(prisma).filter(key =>
      !key.startsWith('_') &&
      !key.startsWith('$') &&
      typeof prisma[key] === 'object'
    );
    models.forEach(model => {
      console.log(`   - ${model}`);
    });

    // 断开连接
    console.log('\n8. Disconnecting...');
    await prisma.$disconnect();
    console.log('   ✅ Disconnected');

    console.log('\n=== ✅ All tests passed! ===\n');
    console.log('Prisma 7 with mssql adapter is ready to use!');
    console.log('\nYou can now use Prisma in your code:');
    console.log('```typescript');
    console.log("import { prisma } from './db/connection';");
    console.log('const users = await prisma.user.findMany();');
    console.log('```');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testPrisma();
