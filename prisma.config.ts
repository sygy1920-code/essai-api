// prisma.config.ts
import { defineConfig } from '@prisma/config'
import dotenv from 'dotenv'

// 手动加载 .env 到 process.env
dotenv.config()

export default defineConfig({
  schema: './prisma/schema.prisma',
  // 用于 CLI 工具（npx prisma db pull / migrate / generate）的连接
  datasource: {
    url: process.env.DATABASE_URL,
  },
})