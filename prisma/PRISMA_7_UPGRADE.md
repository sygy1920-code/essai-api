# Prisma 7 升级指南

本项目已成功升级到 Prisma 7.2.0，并配置了 mssql driver adapter。

## 📦 已安装的依赖

```json
{
  "dependencies": {
    "@prisma/client": "^7.2.0",
    "@prisma/adapter-mssql": "^7.2.0",
    "mssql": "^11.0.0"
  },
  "devDependencies": {
    "prisma": "^7.2.0",
    "@types/mssql": "^9.1.1"
  }
}
```

## 🔄 Prisma 7 主要变更

### 1. Driver Adapter 架构

Prisma 7 引入了 driver adapter 架构，需要显式提供数据库驱动：

**Prisma 6 及之前:**
```typescript
const prisma = new PrismaClient();
// 使用内置的数据库驱动
```

**Prisma 7:**
```typescript
import { PrismaMssql } from '@prisma/adapter-mssql';

const adapter = new PrismaMssql({
  server: 'localhost',
  port: 1433,
  database: 'mydb',
  user: 'sa',
  password: 'password',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
});

const prisma = new PrismaClient({ adapter });
```

### 2. Schema 配置变更

**Prisma 6:**
```prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

**Prisma 7:**
```prisma
datasource db {
  provider = "sqlserver"
}
// 不再在 schema 中配置 DATABASE_URL
// 通过 adapter 的配置对象传递连接参数
```

### 3. 环境变量配置

**使用单独的环境变量** (推荐用于 Prisma 7):
```env
DB_HOST=essaib2b.database.windows.net
DB_PORT=1433
DB_USER=sqladminlogin
DB_PASSWORD=yourpassword!
DB_NAME=b2bdatabase
DB_SSL=true
DB_CONNECTION_LIMIT=10
```

## 🚀 当前配置

### 连接模块 ([src/db/connection.ts](src/db/connection.ts))

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import * as mssql from 'mssql';
import { config } from '../config';

function createPrismaClient(): PrismaClient {
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

  const adapter = new PrismaMssql(mssqlConfig);

  return new PrismaClient({
    adapter,
    log: config.app.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}
```

## 📝 使用示例

### 基本 CRUD 操作

```typescript
import { prisma } from './db/connection';

// 查询所有用户
const users = await prisma.user.findMany();

// 查询单个用户
const user = await prisma.user.findUnique({
  where: { id: 1 }
});

// 创建用户
const newUser = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashed-password',
    name: 'John Doe'
  }
});

// 更新用户
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Jane Doe' }
});

// 删除用户
await prisma.user.delete({
  where: { id: 1 }
});
```

### 事务处理

```typescript
// 使用 $transaction API
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com', password: 'hash' }
  });

  // 其他操作...
  return user;
});
```

### 原始 SQL 查询

```typescript
import { query, execute } from './db/connection';

// 查询
const users = await query<any[]>(
  'SELECT * FROM users WHERE email = @email',
  [{ name: 'email', value: 'user@example.com' }]
);

// 执行命令
const result = await execute(
  'UPDATE users SET name = @name WHERE id = @id',
  [
    { name: 'name', value: 'New Name' },
    { name: 'id', value: 1 }
  ]
);
```

## 🔧 TypeScript 配置

确保 `tsconfig.json` 配置正确：

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "dist",
    "rootDir": ".",
    "sourceMap": true,
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "lib": ["ES2020"]
  }
}
```

**重要**: `"skipLibCheck": true` 是必需的，因为 `tedious` 包的类型定义与某些 TypeScript 版本不兼容。

## 📊 连接测试

运行测试脚本验证配置：

```bash
node test-prisma-adapter.js
```

预期输出：
```
=== Prisma 7 Connection Test (with mssql adapter) ===

1. Checking environment variables...
   ✅ All set

2. Loading modules...
   ✅ Modules loaded

...

=== ✅ All tests passed! ===
```

## 🔄 从 Prisma 6 迁移

如果你之前使用 Prisma 6，主要变更：

1. ✅ 安装 `@prisma/adapter-mssql` 和 `mssql`
2. ✅ 更新 `src/db/connection.ts` 使用 adapter
3. ✅ 更新 `prisma/schema.prisma` 移除 `url` 配置
4. ✅ 使用单独的环境变量而不是 DATABASE_URL
5. ✅ 更新 `tsconfig.json` 添加 `skipLibCheck: true`

## 🎯 优势

使用 Prisma 7 + mssql adapter 的优势：

1. **类型安全**: 完全的 TypeScript 支持
2. **连接池控制**: 更精细的连接池配置
3. **驱动兼容性**: 直接使用 node-mssql 驱动
4. **更好的错误处理**: 改进的错误消息
5. **性能优化**: 查询编译和执行优化

## 📚 相关文档

- [Prisma 7 发布说明](https://www.prisma.io/docs/release-notes/2025-01-16)
- [Driver Adapters 文档](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases/driver-adapters)
- [SQL Server 文档](https://www.prisma.io/docs/orm/overview/databases/sql-server)
- [node-mssql 文档](https://github.com/tediousjs/node-mssql)

## 🐛 故障排除

### 错误: "Using engine type "client" requires either "adapter" or "accelerateUrl""

**原因**: Prisma 7 需要使用 driver adapter。

**解决方案**:
```typescript
import { PrismaMssql } from '@prisma/adapter-mssql';

const adapter = new PrismaMssql(config);
const prisma = new PrismaClient({ adapter });
```

### 错误: "Cannot find name 'AggregateError'"

**原因**: TypeScript 目标版本太低。

**解决方案**: 在 `tsconfig.json` 中设置:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "skipLibCheck": true
  }
}
```

### TypeScript 类型错误

**解决方案**: 确保安装了所有类型定义：
```bash
npm install --save-dev @types/mssql
```

## ✅ 验证安装

检查 Prisma 版本：
```bash
npx prisma --version
# 应该显示: prisma 7.2.0
```

生成 Prisma Client：
```bash
npm run prisma:generate
# 应该显示: ✔ Generated Prisma Client (v7.2.0)
```

构建项目：
```bash
npm run build
# 应该成功编译，没有错误
```
