# Azure Function API - 多路由 + JWT 认证

## 项目概述

这是一个支持多路由和 JWT 认证的 Azure Functions 应用，使用 TypeScript 开发。

## 项目结构

```
src/
├── functions/
│   └── api.ts              # 主 HTTP 触发函数入口
├── routes/
│   ├── index.ts           # 路由定义和查找
│   ├── auth.ts            # 认证路由（登录）
│   ├── users.ts           # 用户路由
│   └── health.ts          # 健康检查路由
├── middleware/
│   └── auth.ts            # JWT 认证中间件
├── utils/
│   └── response.ts        # 响应辅助函数
├── types/
│   └── index.ts           # TypeScript 类型定义
├── config.ts              # 应用配置
```

## 功能特性

### 1. **多路由支持**

支持的路由（需要通过 `/api` 前缀调用）：

| 方法 | 路径 | 认证要求 | 功能 |
|------|------|--------|------|
| GET | `/health` | 否 | 健康检查 |
| POST | `/auth/login` | 否 | 用户登录 |
| GET | `/users/me` | 是 | 获取当前用户信息 |
| GET | `/users` | 是 | 获取所有用户 |

### 2. **JWT 认证**

- **生成令牌**：登录成功后返回 JWT 令牌
- **验证令牌**：受保护的路由需要在请求头包含有效的 JWT
- **令牌格式**：`Authorization: Bearer <token>`

### 3. **错误处理**

- 路由不存在：404
- 缺少认证令牌：401
- 令牌无效或过期：401
- 请求处理失败：500

## 环境配置

在 `local.settings.json` 中设置以下变量：

```json
{
  "Values": {
    "JWT_SECRET": "your-secret-key",
    "JWT_EXPIRES_IN": "7d",
    "FUNCTIONS_WORKER_RUNTIME": "node"
  }
}
```

**默认值：**
- `JWT_SECRET`: `your-secret-key-change-in-production`
- `JWT_EXPIRES_IN`: `7d`

## 使用示例

### 1. 健康检查

```bash
curl http://localhost:7071/api/health
```

响应：
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-01-17T10:00:00.000Z"
}
```

### 2. 登录获取令牌

```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "demo"}'
```

响应：
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "alice"
  }
}
```

### 3. 使用令牌访问受保护路由

```bash
curl http://localhost:7071/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

响应：
```json
{
  "success": true,
  "user": {
    "userId": "user_1234567890",
    "username": "alice",
    "createdAt": "2026-01-17T10:00:00.000Z"
  }
}
```

## 开发命令

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 监听文件变化自动编译
npm run watch

# 启动本地 Azure Functions 运行时
npm start

# 清理编译输出
npm run clean
```

## 路由扩展

在 `src/routes/` 中创建新的路由文件，然后在 `src/routes/index.ts` 中注册：

```typescript
import { myNewRoute } from './my-new-route';

export const routes: Route[] = [
  // ... 其他路由
  {
    method: 'POST',
    path: '/my/path',
    handler: myNewRoute,
    requireAuth: true, // 或 false
  },
];
```

## 中间件扩展

目前已实现 JWT 认证中间件。可以在 `src/middleware/` 中添加更多中间件，如：
- 日志记录
- 速率限制
- 输入验证
- 错误处理等

## 部署到 Azure

1. 创建 Azure Function App
2. 配置环境变量
3. 部署代码

```bash
func azure functionapp publish <app-name>
```

## 安全建议

1. **更改默认 JWT 密钥** - 在生产环境中使用强密钥
2. **启用 HTTPS** - 确保传输层安全
3. **实现速率限制** - 防止暴力攻击
4. **验证输入** - 对所有用户输入进行验证
5. **使用密钥存储** - 在 Azure Key Vault 中存储敏感配置

## 许可证

MIT
