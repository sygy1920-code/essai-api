# Essai API

> 基于 Azure Functions 的教育平台后端 API 服务

Essai API 是一个为教育机构设计的后端服务，提供作业提交、师生管理、AI 评分等功能。项目集成了 Azure SQL Database、Wix Data API，支持多语言（英文/中文）环境。

## 技术栈

### 核心技术
- **Azure Functions v4** - 无服务器计算平台
- **TypeScript 5.0** - 类型安全的 JavaScript 超集
- **Prisma 7.2.0** - 现代化 ORM（采用驱动适配器架构）
- **Azure SQL Database** - 云端 SQL Server 数据库
- **JWT** - JSON Web Token 认证

### 主要依赖
| 依赖 | 版本 | 用途 |
|------|------|------|
| `@azure/functions` | 4.0.0 | Azure Functions SDK |
| `@prisma/client` | 7.2.0 | Prisma 客户端 |
| `@prisma/adapter-mssql` | 7.2.0 | SQL Server 驱动适配器 |
| `@wix/sdk` | 1.21.2 | Wix 平台 SDK |
| `@wix/data` | 1.0.376 | Wix Data API |
| `jsonwebtoken` | 9.0.3 | JWT 令牌处理 |
| `mssql` | 11.0.1 | SQL Server 驱动 |

## 项目结构

```
essai-api/
├── src/
│   ├── functions/
│   │   └── api.ts              # Azure Functions HTTP 触发器入口
│   ├── routes/
│   │   ├── index.ts            # 路由注册表
│   │   ├── health.ts           # 健康检查
│   │   ├── users.ts            # 用户相关路由
│   │   └── submissions.ts      # 作业提交路由
│   ├── middleware/
│   │   └── auth.ts             # JWT 认证中间件
│   ├── services/
│   │   └── wixService.ts       # Wix Data API 集成服务
│   ├── utils/
│   │   └── response.ts         # 响应工具函数
│   ├── db/
│   │   ├── index.ts            # 数据库模块导出
│   │   └── connection.ts       # Prisma 客户端配置
│   ├── types/
│   │   └── index.ts            # TypeScript 类型定义
│   └── config.ts               # 应用配置
├── prisma/
│   ├── schema.prisma           # 数据库模式定义
├── scripts/
│   └── get-wix-collection.ts   # 获取 Wix 集合数据脚本
├── test/                       # 测试目录
├── .env                        # 环境变量
├── local.settings.json         # Azure Functions 本地设置
├── host.json                   # Azure Functions 主机配置
├── tsconfig.json               # TypeScript 配置
└── package.json                # 依赖和脚本
```

## 核心功能

### 1. 师生管理
- 与 Wix 平台集成，管理教师和学生关系
- 教师可查看其所属学校/班级的学生列表
- 支持多角色（teachers/students）

### 2. 作业提交管理
- 学生提交作业（英文/中文版本）
- 分页查询提交记录
- 按上传时间倒序排列
- 多语言支持

### 3. AI 智能评分
- 作文自动评分
- 语法检查
- 拼写检查
- 详细反馈报告

### 4. 语音评测
- 发音评分
- Azure Speech Services 集成

### 5. 阅读理解
- 阅读材料管理
- 问题管理
- 学生提交记录

## API 端点

### 基础信息
- **Base URL**: `/api`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

### 可用端点

#### 1. 健康检查
```http
GET /api/health
```

**认证**: 无需认证

**响应示例**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-01-17T10:00:00.000Z"
}
```

#### 2. 获取当前用户信息
```http
GET /api/users/me
```

**认证**: 需要 JWT

**响应示例**:
```json
{
  "success": true,
  "user": {
    "memberId": "123456",
    "rolekey": "teachers",
    "school": "Hong Kong School",
    "email": "teacher@example.com"
  }
}
```

#### 3. 获取教师的学生列表
```http
GET /api/users/students
```

**认证**: 需要 JWT（仅教师角色）

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "student1",
      "memberId": "789012",
      "title": "student@example.com",
      "firstname_e": "John",
      "lastname_e": "Doe",
      "school": "Hong Kong School",
      "class": "P1A",
      "rolekey": "students"
    }
  ]
}
```

#### 4. 获取作业提交列表
```http
GET /api/submission/list?page=1&pageSize=10&lang=en
```

**认证**: 需要 JWT

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `pageSize` | number | 否 | 10 | 每页数量（最大 100） |
| `lang` | string | 否 | en | 语言（en/hk） |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "submission1",
      "Email": "student@example.com",
      "Title": "My Homework",
      "UploadTime": "2026-01-17T10:00:00.000Z",
      "Report": "{}"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 环境配置

### 必需的环境变量

在 `.env` 或 `local.settings.json` 中配置：

### 配置说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | Prisma 数据库连接字符串 | - |
| `DB_HOST` | 数据库主机 | - |
| `DB_PORT` | 数据库端口 | - |
| `DB_NAME` | 数据库名称 | - |
| `JWT_SECRET` | JWT 签名密钥 | - |
| `JWT_EXPIRES_IN` | JWT 过期时间 | 7d |
| `WIX_API_KEY` | Wix API 密钥 | - |

## 开发指南

### 前置要求

- Node.js 18.x 或更高版本
- npm 或 yarn
- Azure Functions Core Tools v4

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd essai-api

# 安装依赖
npm install
```

### 数据库设置

```bash
# 从现有数据库拉取 Schema
npm run prisma:pull

# 生成 Prisma Client
npm run prisma:generate
```

### 本地开发

```bash
# 终端 1: 监听 TypeScript 变化
npm run watch

# 终端 2: 启动 Azure Functions 运行时
npm start
```

服务将在 `http://localhost:7071` 启动。

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run build` | 编译 TypeScript |
| `npm run watch` | 监听模式编译 |
| `npm start` | 启动 Azure Functions |
| `npm run dev` | 清理、构建并启动 |
| `npm run clean` | 清理编译输出 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:pull` | 拉取数据库 Schema |
| `npm run wix:collection` | 获取 Wix 集合数据 |
| `npm test` | 运行测试 |

### 添加新路由

1. 在 [src/routes/](src/routes/) 创建路由文件：

```typescript
// src/routes/my-route.ts
import { Context } from '@azure/functions';

export async function myRoute(ctx: Context) {
  const { req, res } = ctx;

  // 处理逻辑
  res.json({
    success: true,
    data: 'response'
  });
}
```

2. 在 [src/routes/index.ts](src/routes/index.ts) 注册路由：

```typescript
import { myRoute } from './my-route';

export const routes: Route[] = [
  // ... 其他路由
  {
    method: 'GET',
    path: '/my-path',
    handler: myRoute,
    requireAuth: true,
  },
];
```

## 数据库架构

### 核心表

**用户提交**:
- `userdata` - 英文版本提交
- `c_userdata` - 中文版本提交

**图片处理**:
- `imagedata` - 基础图片数据
- `imagedata_full` - 完整分析数据（含 OCR）
- `c_imagedata` / `c_imagedata_full` - 中文版本

**PDF 处理**:
- `pdfdata` - PDF 元数据和存储
- `c_pdfdata` - 中文版本

**教育功能**:
- `Comprehension` - 阅读理解材料
- `ComprehensionQuestion` - 阅读理解问题
- `ComprehensionSubmission` - 学生提交
- `pronunciation_assessment` - 语音评分
- `teacherAssignment` - 教师作业分配

**AI 分析**:
- `deepseek_all_in_one_table` - 综合分析结果
- `grammar_analysis` - 语法分析
- `report_score` - 评分报告

### Prisma Client 使用

```typescript
import { prisma } from './db';

// 查询示例
const submissions = await prisma.userdata.findMany({
  where: {
    Email: 'student@example.com'
  },
  orderBy: {
    UploadTime: 'desc'
  },
  take: 10
});
```

## Wix 集成

### 配置

```typescript
// src/services/wixService.ts
import { wixService } from './services/wixService';

// 获取教师的学生列表
const students = await wixService.getStudentsByTeacher('teacher@example.com');
```

### Member 模式

```typescript
interface Member {
  _id: string;
  memberId: string;
  title: string;        // 邮箱
  school: string;
  class: string;
  rolekey: 'teachers' | 'students';
  firstname_e: string;
  lastname_e: string;
  firstname_c: string;
  lastname_c: string;
}
```

## JWT 认证

### Token 结构

```json
{
  "memberId": "123456",
  "rolekey": "teachers",
  "school": "Hong Kong School",
  "email": "teacher@example.com",
  "iat": 1642425600,
  "exp": 1643030400
}
```

### 使用认证

```typescript
import { authMiddleware } from './middleware/auth';

// 在路由中使用
{
  method: 'GET',
  path: '/protected',
  handler: myHandler,
  requireAuth: true,  // 启用 JWT 认证
}
```

### 请求头格式

```
Authorization: Bearer <token>
```

## 部署

### 部署到 Azure

```bash
# 构建
npm run build

# 发布到 Azure Functions
func azure functionapp publish <app-name>
```

### 部署前检查清单

- [ ] 配置生产环境数据库连接
- [ ] 更新 `JWT_SECRET` 为安全值
- [ ] 配置生产环境 `WIX_API_KEY`
- [ ] 在 Azure 中设置环境变量
- [ ] 验证 Application Insights 配置
- [ ] 确认 HTTPS 已启用

## 安全建议

1. **JWT 密钥**: 生产环境使用强密钥（建议 256 位随机字符串）
2. **密钥存储**: 使用 Azure Key Vault 存储敏感配置
3. **输入验证**: 对所有用户输入进行验证和清理
4. **速率限制**: 实施请求速率限制防止滥用
5. **HTTPS**: 确保所有通信使用 HTTPS
6. **日志监控**: 监控异常请求和认证失败

## 架构设计

### 设计模式

1. **路由适配器模式**: 自定义适配器将 Azure Functions HTTP 请求转换为 Koa 风格上下文
2. **单例模式**: Prisma Client 和 WixService 作为单例导出
3. **中间件模式**: JWT 认证中间件，可扩展添加日志、限流等
4. **服务层模式**: `wixService.ts` 封装外部 API 逻辑

### 技术亮点

- **Prisma 7 驱动适配器**: 直接集成 node-mssql 驱动，性能更优
- **连接池管理**: 最大 10 个连接，支持 SSL 加密
- **多语言支持**: 英文/中文双版本表结构
- **无服务器架构**: 按需计费，自动扩展
- **类型安全**: 全面的 TypeScript 类型定义

## 故障排查

### 常见问题

**1. 数据库连接失败**
```
Error: Cannot connect to database
```
解决方案: 检查 `DATABASE_URL` 和防火墙设置

**2. JWT 验证失败**
```
Error: jwt malformed
```
解决方案: 确认 Token 格式正确（`Bearer <token>`）

**3. Prisma Client 未生成**
```
Error: @prisma/client did not initialize yet
```
解决方案: 运行 `npm run prisma:generate`

**4. Wix API 调用失败**
```
Error: Invalid Wix API key
```
解决方案: 检查 `WIX_API_KEY` 环境变量

## 贡献指南

欢迎贡献！请遵循以下流程：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交信息规范

- `feat`: 新功能
- `fix`: Bug 修复
- `refactor`: 代码重构
- `docs`: 文档更新
- `test`: 测试相关
- `chore`: 构建/工具变更

## 许可证

MIT License

## 联系方式

- 项目地址: [GitHub Repository]
- 问题反馈: [Issues]

---

**最后更新**: 2026-01-17
