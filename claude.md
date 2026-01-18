# Claude Code 项目指南

本文档为 AI 助手（Claude Code）提供项目上下文和开发指导。

## 项目概览

**项目名称**: Essai API
**项目类型**: Azure Functions 后端 API 服务
**主要功能**: 教育平台后端，提供师生管理、作业提交、AI 评分等功能
**技术栈**: TypeScript + Azure Functions + Prisma + Azure SQL + Wix API

## 核心概念

### 架构特点

1. **无服务器架构**: 使用 Azure Functions v4，按需计费
2. **路由适配器模式**: 自定义 `koa-adapter.ts` 将 Azure Functions HTTP 请求转换为 Koa 风格上下文
3. **多语言支持**: 英文（userdata）和中文（c_userdata）双版本表结构
4. **Prisma 7**: 使用新的驱动适配器架构，直接集成 node-mssql

### 关键设计决策

- **为什么使用路由适配器**: Azure Functions 原生不支持像 Express/Koa 这样的路由系统，通过适配器实现熟悉的路由开发体验
- **为什么有双版本表**: 服务香港地区学校，需要支持英文和中文两种语言环境
- **为什么使用 Prisma 7 驱动适配器**: 性能更好，减少一层抽象，直接使用底层数据库驱动

## 目录结构说明

```
src/
├── functions/api.ts          # Azure Functions HTTP 触发器入口点
├── routes/                   # 路由处理器（业务逻辑）
│   ├── index.ts             # 路由注册表
│   ├── health.ts            # 健康检查
│   ├── users.ts             # 用户相关
│   └── submissions.ts       # 作业提交
├── middleware/auth.ts        # JWT 认证中间件
├── services/wixService.ts    # Wix API 集成服务
├── utils/
│   └── response.ts          # 响应格式化
├── db/
│   ├── index.ts             # 数据库模块导出
│   └── connection.ts        # Prisma 客户端配置
├── types/index.ts            # TypeScript 类型定义
└── config.ts                 # 应用配置
```

## 开发工作流

### 添加新功能

1. **创建路由文件**:
   - 在 `src/routes/` 创建新的路由文件
   - 导出符合 `RouteHandler` 类型的处理函数

2. **注册路由**:
   - 在 `src/routes/index.ts` 的 `routes` 数组中添加路由配置
   - 设置 `method`、`path`、`handler`、`requireAuth`

3. **添加类型定义**:
   - 在 `src/types/index.ts` 添加相关类型

4. **测试路由**:
   - 使用 `npm run dev` 启动开发环境
   - 使用 curl 或 Postman 测试

### 数据库操作

1. **修改 Schema**:
   - 直接修改 `prisma/schema.prisma`
   - 或使用 `npm run prisma:pull` 从数据库拉取

2. **生成 Client**:
   - 运行 `npm run prisma:generate`

3. **使用 Prisma Client**:
   ```typescript
   import { prisma } from './db';
   const data = await prisma.userdata.findMany(...);
   ```

### 添加中间件

在 `src/middleware/` 创建中间件函数，然后在路由配置中使用：

```typescript
export const routes: Route[] = [
  {
    method: 'GET',
    path: '/protected',
    handler: myHandler,
    requireAuth: true,  // 使用现有认证中间件
  },
];
```

## 重要约定

### 命名约定

- **路由文件**: 小写，连字符分隔（如 `user-profiles.ts`）
- **路由路径**: 小写，连字符分隔（如 `/api/user-profiles`）
- **数据库表**: 驼峰命名（如 `userdata`、`c_userdata`）
- **类型接口**: PascalCase（如 `UserData`、`Member`）

### 代码风格

- **TypeScript**: 使用类型注解，避免 `any`
- **异步处理**: 使用 `async/await`
- **错误处理**: 使用 try-catch，返回统一错误格式
- **响应格式**: 使用 `res.success()`、`res.error()` 工具函数

### 环境变量

所有敏感配置使用环境变量：

- `DATABASE_URL` - 数据库连接字符串
- `JWT_SECRET` - JWT 签名密钥
- `WIX_API_KEY` - Wix API 密钥

不要在代码中硬编码敏感信息。

## 常见任务

### 创建新的 API 端点

```typescript
// src/routes/example.ts
import { Context } from '@azure/functions';
import { prisma } from '../db';

export async function getExample(ctx: Context) {
  const { req, res } = ctx;

  try {
    const data = await prisma.userdata.findMany();

    res.success({
      data,
      count: data.length
    });
  } catch (error) {
    res.error('Failed to fetch data', 500);
  }
}

// src/routes/index.ts
export const routes: Route[] = [
  {
    method: 'GET',
    path: '/example',
    handler: getExample,
    requireAuth: false,
  },
];
```

### 添加数据库查询

```typescript
import { prisma } from './db';

// 简单查询
const users = await prisma.userdata.findMany({
  where: { Email: 'user@example.com' },
  orderBy: { UploadTime: 'desc' },
  take: 10
});

// 分页查询
const page = 1;
const pageSize = 10;
const [data, totalCount] = await Promise.all([
  prisma.userdata.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { UploadTime: 'desc' }
  }),
  prisma.userdata.count()
]);
```

### 调用 Wix API

```typescript
import { wixService } from './services/wixService';

// 获取教师的学生列表
const students = await wixService.getStudentsByTeacher('teacher@example.com');
```

### 使用认证信息

```typescript
import { Context } from '@azure/functions';

export async function myRoute(ctx: Context) {
  const { user } = ctx; // 由 auth 中间件注入

  // user 包含: memberId, rolekey, school, email
  if (user?.rolekey !== 'teachers') {
    return res.error('Unauthorized', 403);
  }

  // 继续处理...
}
```

## 调试技巧

### 本地开发

1. **启动开发环境**:
   ```bash
   npm run dev
   ```

2. **查看日志**: Azure Functions 控制台输出

3. **测试端点**:
   ```bash
   curl http://localhost:7071/api/health
   ```

### 常见问题

**问题**: JWT 验证失败
- 检查 Token 格式：`Authorization: Bearer <token>`
- 检查 `JWT_SECRET` 环境变量

**问题**: 数据库连接失败
- 检查 `DATABASE_URL` 格式
- 确认数据库可访问
- 运行 `npm run prisma:generate`

**问题**: Prisma Client 未初始化
- 运行 `npm run prisma:generate`
- 检查 `prisma/schema.prisma` 文件

**问题**: 路由不匹配
- 检查路径是否以 `/api` 开头
- 检查 HTTP 方法（GET/POST/PUT/DELETE）
- 查看 `src/routes/index.ts` 路由配置

## 测试策略

### 单元测试

当前项目没有设置测试框架。建议添加：

```bash
npm install --save-dev jest @types/jest ts-jest
```

### 集成测试

可以使用 `supertest` 测试 API 端点：

```bash
npm install --save-dev supertest @types/supertest
```

### 手动测试

使用 curl 或 Postman：

```bash
# 健康检查
curl http://localhost:7071/api/health

# 获取用户信息（需要 JWT）
curl http://localhost:7071/api/users/me \
  -H "Authorization: Bearer <token>"
```

## 性能优化

### 数据库查询

- 使用 `select` 限制返回字段
- 使用 `take` 和 `skip` 实现分页
- 避免循环查询，使用 `findMany` 一次性获取

### 连接池

当前配置：
```typescript
connectionLimit: 10
```

根据负载调整连接池大小。

### 缓存

考虑添加 Redis 缓存频繁访问的数据（如学生列表）。

## 部署注意事项

### 环境变量

部署前确保在 Azure 中配置所有环境变量：

```bash
az functionapp config appsettings set \
  --name <app-name> \
  --resource-group <resource-group> \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    JWT_SECRET="$JWT_SECRET" \
    WIX_API_KEY="$WIX_API_KEY"
```

### 构建和发布

```bash
npm run build
func azure functionapp publish <app-name>
```

### 监控

- 使用 Application Insights 监控性能
- 查看日志：`func azure functionapp logstream <app-name>`

## 扩展建议

### 短期改进

1. **添加输入验证**: 使用 `zod` 或 `joi` 验证请求参数
2. **完善错误处理**: 统一错误处理中间件
3. **添加日志**: 使用 Winston 或 Pino
4. **添加测试**: 单元测试和集成测试

### 长期改进

1. **API 文档**: 集成 Swagger/OpenAPI
2. **速率限制**: 防止 API 滥用
3. **缓存层**: Redis 缓存热点数据
4. **队列系统**: 使用 Azure Queues 处理耗时任务
5. **GraphQL**: 考虑迁移到 GraphQL 提供更灵活的查询

## 相关资源

### 内部文档

- [README.md](README.md) - 项目概览和用户文档
- [prisma/PRISMA_7_UPGRADE.md](prisma/PRISMA_7_UPGRADE.md) - Prisma 7 升级指南
- [prisma/PRISMA_USAGE.md](prisma/PRISMA_USAGE.md) - Prisma 使用文档

### 外部资源

- [Azure Functions 文档](https://docs.microsoft.com/azure/azure-functions/)
- [Prisma 文档](https://www.prisma.io/docs/)
- [Wix Data API](https://dev.wix.com/api/rest/wix-data)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)

## 快速参考

### 常用命令

```bash
# 开发
npm run dev              # 清理、构建、启动
npm run watch            # 监听模式
npm start                # 启动 Azure Functions

# 构建
npm run build            # 编译 TypeScript
npm run clean            # 清理 dist/

# 数据库
npm run prisma:generate  # 生成 Prisma Client
npm run prisma:pull      # 拉取数据库 Schema

# 工具
npm run wix:collection   # 获取 Wix 数据
npm test                 # 运行测试
```

### 端点快速参考

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/health` | GET | 否 | 健康检查 |
| `/api/users/me` | GET | 是 | 当前用户信息 |
| `/api/users/students` | GET | 是 | 教师的学生列表 |
| `/api/submission/list` | GET | 是 | 作业提交列表 |

### 数据库表快速参考

| 表名 | 用途 | 语言版本 |
|------|------|----------|
| `userdata` | 用户提交 | 英文 |
| `c_userdata` | 用户提交 | 中文 |
| `imagedata` | 图片数据 | 英文 |
| `c_imagedata` | 图片数据 | 中文 |
| `Comprehension` | 阅读理解 | - |
| `pronunciation_assessment` | 语音评分 | - |
| `report_score` | 评分报告 | - |

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-17
