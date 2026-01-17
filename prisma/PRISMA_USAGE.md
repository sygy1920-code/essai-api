# Prisma 使用指南

本项目已成功配置 Prisma ORM 与 Azure SQL 数据库集成。

## 配置说明

### 环境变量配置

数据库连接参数可以从两个地方获取（按优先级排序）:

1. **DATABASE_URL** - 完整的连接字符串（优先级最高）
2. **单独的参数** - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL

在 `.env` 文件中：
```env
# 方式 1: 使用完整连接字符串 (JDBC 标准格式)
DATABASE_URL="sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD;encrypt=true;trustServerCertificate=true"

# 示例
DATABASE_URL="sqlserver://essaib2b.database.windows.net:1433;database=b2bdatabase;user=sqladminlogin;password=yourpassword!;encrypt=true;trustServerCertificate=true"

# 方式 2: 使用单独的参数（如果没有 DATABASE_URL）
DB_HOST=essaib2b.database.windows.net
DB_PORT=1433
DB_USER=sqladminlogin
DB_PASSWORD=your-password
DB_NAME=b2bdatabase
DB_SSL=true
```

在 `local.settings.json` 中（用于本地 Azure Functions 开发）：
```json
{
  "Values": {
    "DATABASE_URL": "sqlserver://essaib2b.database.windows.net:1433;database=b2bdatabase;user=sqladminlogin;password=yourpassword!;encrypt=true;trustServerCertificate=true",
    "DB_HOST": "essaib2b.database.windows.net",
    "DB_PORT": "1433",
    "DB_USER": "sqladminlogin",
    "DB_PASSWORD": "your-password",
    "DB_NAME": "b2bdatabase",
    "DB_SSL": "true"
  }
}
```

### ⚠️ 重要提示：连接字符串格式

**Prisma SQL Server 使用 JDBC 标准连接字符串格式**，而不是传统的 URL 格式：

✅ **正确格式**:
```
sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD;encrypt=true;trustServerCertificate=true
```

❌ **错误格式**:
```
sqlserver://USER:PASSWORD@HOST:PORT/DATABASE?encrypt=true
```

如果密码中包含特殊字符（如 `:`, `=`, `;`, `/`, `[`, `]`, `{`, `}`），需要使用花括号 `{}` 包围：
```
password={My:Password;}
```

## 基本使用

### 1. 导入 Prisma Client

```typescript
import { prisma } from './db/connection';

// 或者导入特定模型
import { prisma } from './db/connection';
```

### 2. CRUD 操作示例

#### 创建记录
```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashed-password',
    name: 'John Doe'
  }
});
```

#### 查询记录
```typescript
// 查询单个用户
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});

// 查询多个用户
const users = await prisma.user.findMany({
  where: { name: { contains: 'John' } },
  orderBy: { createdAt: 'desc' }
});

// 分页查询
const users = await prisma.user.findMany({
  skip: 0,
  take: 10
});
```

#### 更新记录
```typescript
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'Jane Doe'
  }
});
```

#### 删除记录
```typescript
await prisma.user.delete({
  where: { id: 1 }
});
```

### 3. 事务处理

```typescript
// 方式 1: 使用 $transaction API
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com', password: 'hash' }
  });

  // 其他操作...
  return user;
});

// 方式 2: 批量事务
const result = await prisma.$transaction([
  prisma.user.create({ data: { email: 'user1@example.com', password: 'hash' } }),
  prisma.user.create({ data: { email: 'user2@example.com', password: 'hash' } })
]);
```

### 4. 原始 SQL 查询

```typescript
import { query, execute } from './db/connection';

// 执行查询
const users = await query<any[]>('SELECT * FROM users WHERE email = ?', ['user@example.com']);

// 执行命令
const result = await execute('UPDATE users SET name = ? WHERE id = ?', ['New Name', 1]);
```

## 数据库模型

当前定义的模型（在 `prisma/schema.prisma` 中）：

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

## 可用的 NPM 脚本

```bash
# 生成 Prisma Client
npm run prisma:generate

# 创建并应用迁移（开发环境）
npm run prisma:migrate

# 应用迁移（生产环境）
npm run prisma:deploy

# 打开 Prisma Studio（数据库管理界面）
npm run prisma:studio

# 重置数据库
npm run prisma:reset
```

## 添加新模型

1. 编辑 `prisma/schema.prisma` 文件
2. 添加或修改模型定义
3. 运行迁移：`npm run prisma:migrate`
4. 重新生成 Prisma Client：`npm run prisma:generate`

示例：

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Decimal
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("products")
}
```

## 连接检查

```typescript
import { checkConnection } from './db/connection';

const isConnected = await checkConnection();
console.log('Database connected:', isConnected);
```

## 注意事项

1. **Azure SQL 连接字符串格式**:
   - 使用 `sqlserver://` 协议
   - 端口默认为 1433
   - Azure SQL 需要启用 SSL: `encrypt=true&trustServerCertificate=true`

2. **环境变量优先级**:
   - 代码中会首先检查 `DATABASE_URL`
   - 如果不存在，则从 `DB_HOST`, `DB_PORT` 等单独参数构建连接字符串

3. **Prisma 7 变更**:
   - 连接字符串通过环境变量 `DATABASE_URL` 传递
   - 不再在 schema 文件中配置 `url` 属性

## 相关文档

- [Prisma 文档](https://www.prisma.io/docs)
- [Azure SQL 连接字符串](https://www.connectionstrings.com/azure-sql-database/)
- [Prisma Schema 参考](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
