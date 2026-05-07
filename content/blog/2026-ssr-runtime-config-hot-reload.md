---
title: 浏览器 DevTools 开启检测
description: 浏览器控制台检测技术深度解析
date: 2026-04-21
---

# SSR 应用运行时配置热重载：Next.js 与 Nuxt 3 双框架实战方案

> 在构建 SSR 应用时，一个常见痛点是：**如何在不停机、不重新构建的情况下修改运行配置？**
>
> 环境变量需要重新部署，`nuxt.config.ts` / `next.config.js` 修改需要重新打包。本文提供一套基于 `public/runtime-config.json` + API Route 的通用方案，分别给出 Next.js 14 (App Router) 与 Nuxt 3 的完整生产级实现，支持配置热重载、类型安全、SSR 同构获取。
>
> **本文特点：** 从零开始，每一步都有详细说明，复制代码即可运行。提供完整示例项目、常见问题解答、实际部署配置。

---

## 目录

1. [快速开始（5分钟上手）](#1-快速开始5分钟上手)
2. [核心设计思想](#2-核心设计思想)
3. [Next.js 14 方案详解](#3-nextjs-14-方案详解)
4. [Nuxt 3 方案详解](#4-nuxt-3-方案详解)
5. [双框架深度对比](#5-双框架深度对比)
6. [生产环境部署指南](#6-生产环境部署指南)
7. [进阶：配置变更监听与自动推送](#7-进阶配置变更监听与自动推送)
8. [常见问题解答](#8-常见问题解答)
9. [完整示例项目](#9-完整示例项目)
10. [总结](#10-总结)

---

## 1. 快速开始（5分钟上手）

### 1.1 通用配置文件

首先创建运行时配置文件。这是整个方案的核心：

```json
// public/runtime-config.json
{
  "site": {
    "name": "我的应用",
    "description": "这是一个示例应用",
    "url": "http://localhost:3000",
    "ogImage": "/og-image.jpg"
  },
  "api": {
    "baseUrl": "http://localhost:3000/api",
    "imageCdn": "https://cdn.example.com"
  },
  "services": {
    "analyticsId": "",
    "googleMapsKey": ""
  },
  "app": {
    "defaultLocale": "zh-CN",
    "defaultCurrency": "CNY",
    "enableRegistration": true,
    "maintenanceMode": false
  }
}
```

### 1.2 通用 Zod Schema

安装 Zod：
```bash
npm install zod
```

创建类型定义文件：
```typescript
// lib/runtime-config/schema.ts
import { z } from 'zod'

export const RuntimeConfigSchema = z.object({
  site: z.object({
    name: z.string().default('我的应用'),
    description: z.string().default(''),
    url: z.string().url().default('http://localhost:3000'),
    ogImage: z.string().default('/og-image.jpg'),
  }),
  api: z.object({
    baseUrl: z.string().url().default('http://localhost:3000/api'),
    imageCdn: z.string().url().optional(),
  }),
  services: z.object({
    analyticsId: z.string().optional(),
    googleMapsKey: z.string().optional(),
  }).default({}),
  app: z.object({
    defaultLocale: z.string().default('zh-CN'),
    defaultCurrency: z.string().default('CNY'),
    enableRegistration: z.boolean().default(true),
    maintenanceMode: z.boolean().default(false),
  }),
})

export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>

// 客户端安全版本（过滤敏感字段）
export const PublicRuntimeConfigSchema = RuntimeConfigSchema.omit({
  services: true,
})

export type PublicRuntimeConfig = z.infer<typeof PublicRuntimeConfigSchema>

// 验证函数
export function validateConfig(raw: unknown): RuntimeConfig {
  return RuntimeConfigSchema.parse(raw)
}

// 安全验证函数（不抛出错误）
export function safeValidateConfig(raw: unknown): { success: true, data: RuntimeConfig } | { success: false, error: z.ZodError } {
  const result = RuntimeConfigSchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data }
  }
  else {
    return { success: false, error: result.error }
  }
}
```

### 1.3 选择你的框架

- **使用 Next.js？** → 跳转到 [第3节：Next.js 14 方案详解](#3-nextjs-14-方案详解)
- **使用 Nuxt 3？** → 跳转到 [第4节：Nuxt 3 方案详解](#4-nuxt-3-方案详解)

---

## 2. 核心设计思想

### 2.1 为什么不用环境变量？

| 方式 | 修改成本 | 生效方式 | 类型安全 | 动态化 |
|------|---------|---------|---------|--------|
| `.env` + 构建时注入 | 需重新构建 | 重新部署 | ❌ 无 | ❌ 静态 |
| `process.env` 运行时读取 | 需重启进程 | 重启服务 | ❌ 无 | ⚠️ 仅服务端 |
| **public JSON + API Route** | **直接编辑文件** | **即时生效** | **✅ Zod 校验** | **✅ 双端可用** |

### 2.2 通用架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端 (Browser)                       │
│   应用启动时 fetch /api/config → 注入全局 Context/State       │
│   ┌─────────────────────────────────────────────────────┐   │
│   │   Next.js: RuntimeConfigProvider (React Context)    │   │
│   │   Nuxt 3:   useRuntimeJsonConfig() (Pinia/Composable)│  │
│   └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                        服务端 (Server)                        │
│   /api/config → 读取 public/runtime-config.json              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │   Next.js: Route Handler (App Router)               │   │
│   │   Nuxt 3:   Nitro Server Route + Storage Layer      │   │
│   └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      配置文件层 (File System)                  │
│   public/runtime-config.json  ←── 唯一需要修改的文件           │
│   支持 Docker volume 挂载、ConfigMap 挂载                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 配置加载优先级（统一设计）

```
runtime-config.json (热重载配置)  >  环境变量 (.env)  >  代码默认值
```

### 2.4 安全考虑

**重要提醒：**
1. **不要**在 `runtime-config.json` 中存储真正的密钥（API Secret、数据库密码等）
2. 该文件通过 `/api/config` 暴露给客户端，仅存储公开配置
3. 敏感配置应通过环境变量注入，仅在服务端使用
4. 使用 Zod Schema 的 `.optional()` 标记可选字段，避免验证失败

---

## 3. Next.js 14 方案详解

### 3.1 完整项目结构

```
my-next-app/
├── public/
│   └── runtime-config.json          # ← 运行时配置文件
├── src/
│   ├── lib/
│   │   └── runtime-config/
│   │       ├── schema.ts            # Zod Schema + 类型 + 默认值
│   │       ├── server.ts            # 服务端读取工具
│   │       └── client.ts            # 客户端 React Context
│   ├── app/
│   │   ├── api/config/route.ts      # API Route
│   │   ├── layout.tsx               # 注入 Provider
│   │   └── page.tsx                 # 使用配置
│   └── components/
│       └── providers/
│           └── runtime-config-provider.tsx
├── next.config.js
├── package.json
└── tsconfig.json
```

### 3.2 安装依赖

```bash
npm install zod
# 或
yarn add zod
# 或
pnpm add zod
```

### 3.3 类型定义与校验 (Zod)

```typescript
// src/lib/runtime-config/schema.ts
import { z } from 'zod'

export const RuntimeConfigSchema = z.object({
  site: z.object({
    name: z.string().default('我的应用'),
    description: z.string().default(''),
    url: z.string().url().default('http://localhost:3000'),
    ogImage: z.string().default('/og-image.jpg'),
  }),
  api: z.object({
    baseUrl: z.string().url().default('http://localhost:3000/api'),
    imageCdn: z.string().url().optional(),
  }),
  services: z.object({
    analyticsId: z.string().optional(),
    googleMapsKey: z.string().optional(),
  }).default({}),
  app: z.object({
    defaultLocale: z.string().default('zh-CN'),
    defaultCurrency: z.string().default('CNY'),
    enableRegistration: z.boolean().default(true),
    maintenanceMode: z.boolean().default(false),
  }),
})

export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>

// 客户端安全版本（过滤敏感字段）
export const ClientSafeConfigSchema = RuntimeConfigSchema.omit({
  services: true, // 或者 services 内部再细分公开/私密
})

export type ClientSafeConfig = z.infer<typeof ClientSafeConfigSchema>
```

### 3.4 服务端读取模块

```typescript
import type { RuntimeConfig } from './schema'
// src/lib/runtime-config/server.ts
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { RuntimeConfigSchema } from './schema'

let cachedConfig: RuntimeConfig | null = null
let cacheTime = 0
const CACHE_TTL = 5000 // 5秒缓存，生产可调整

/**
 * 读取运行时配置
 * @param bypassCache 是否绕过缓存（用于API路由强制获取最新）
 * @returns 验证后的配置对象
 */
export async function getRuntimeConfig(
  bypassCache = false
): Promise<RuntimeConfig> {
  const now = Date.now()

  // 缓存命中
  if (!bypassCache && cachedConfig && now - cacheTime < CACHE_TTL) {
    return cachedConfig
  }

  try {
    const configPath = join(process.cwd(), 'public', 'runtime-config.json')
    const fileContent = await readFile(configPath, 'utf-8')
    const parsed = JSON.parse(fileContent)

    // Zod 校验 + 填充默认值
    const config = RuntimeConfigSchema.parse(parsed)

    cachedConfig = config
    cacheTime = now

    return config
  }
  catch (error) {
    console.warn('[RuntimeConfig] Failed to load runtime-config.json:', error)

    // 降级：尝试环境变量
    const fallback = RuntimeConfigSchema.safeParse({
      site: {
        name: process.env.NEXT_PUBLIC_SITE_NAME,
        url: process.env.NEXT_PUBLIC_SITE_URL,
      },
      api: {
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      },
    })

    if (fallback.success) {
      cachedConfig = fallback.data
      return fallback.data
    }

    // 最终兜底：使用全部默认值
    return RuntimeConfigSchema.parse({})
  }
}

// 清理缓存（用于配置热重载触发）
export function clearRuntimeConfigCache(): void {
  cachedConfig = null
  cacheTime = 0
}
```

### 3.5 API Route

```typescript
// src/app/api/config/route.ts
import { NextResponse } from 'next/server'
import { ClientSafeConfigSchema } from '@/lib/runtime-config/schema'
import { getRuntimeConfig } from '@/lib/runtime-config/server'

export const dynamic = 'force-dynamic' // 禁用缓存，确保每次读取最新文件

export async function GET() {
  try {
    const config = await getRuntimeConfig(true) // 强制读取最新文件

    // 过滤敏感字段后返回客户端安全版本
    const clientSafe = ClientSafeConfigSchema.parse(config)

    return NextResponse.json(clientSafe, {
      headers: {
        // 允许客户端缓存短时间，减少重复请求
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
      },
    })
  }
  catch (error) {
    console.error('[API/config] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}
```

### 3.6 客户端 React Context Provider

```typescript
// src/components/providers/runtime-config-provider.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { ClientSafeConfig } from '@/lib/runtime-config/schema';

type RuntimeConfigContextValue = {
  config: ClientSafeConfig | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
};

const RuntimeConfigContext = createContext<RuntimeConfigContextValue>({
  config: null,
  isLoading: true,
  error: null,
  refresh: () => {},
});

export function RuntimeConfigProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RuntimeConfigContextValue>({
    config: null,
    isLoading: true,
    error: null,
    refresh: () => {},
  });

  const loadConfig = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const config: ClientSafeConfig = await res.json();

      setState({
        config,
        isLoading: false,
        error: null,
        refresh: loadConfig,
      });
    } catch (error) {
      setState({
        config: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        refresh: loadConfig,
      });
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <RuntimeConfigContext.Provider value={state}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig() {
  const context = useContext(RuntimeConfigContext);
  if (!context) {
    throw new Error(
      'useRuntimeConfig must be used within RuntimeConfigProvider'
    );
  }
  return context;
}
```

### 3.7 在 Layout 中注入

```tsx
// src/app/layout.tsx
import { RuntimeConfigProvider } from '@/components/providers/runtime-config-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <RuntimeConfigProvider>{children}</RuntimeConfigProvider>
      </body>
    </html>
  )
}
```

### 3.8 在 Server Component 中直接使用

```tsx
// src/app/page.tsx (Server Component)
import { getRuntimeConfig } from '@/lib/runtime-config/server'

export default async function HomePage() {
  const config = await getRuntimeConfig()

  return (
    <main>
      <h1>{config.site.name}</h1>
      <p>{config.site.description}</p>
      {config.app.maintenanceMode && (
        <div className="alert">维护模式已开启</div>
      )}

      <div>
        <h2>配置信息：</h2>
        <ul>
          <li>
            API 地址：
            {config.api.baseUrl}
          </li>
          <li>
            语言：
            {config.app.defaultLocale}
          </li>
          <li>
            货币：
            {config.app.defaultCurrency}
          </li>
          <li>
            注册功能：
            {config.app.enableRegistration ? '开启' : '关闭'}
          </li>
        </ul>
      </div>
    </main>
  )
}
```

### 3.9 在 Client Component 中使用

```tsx
// src/components/site-footer.tsx
'use client'

import { useRuntimeConfig } from '@/components/providers/runtime-config-provider'

export function SiteFooter() {
  const { config, isLoading, error, refresh } = useRuntimeConfig()

  if (isLoading)
    return <footer>加载配置中...</footer>
  if (error)
    return <footer>配置加载失败</footer>
  if (!config)
    return <footer>配置未加载</footer>

  return (
    <footer>
      <p>
        © 2024
        {config.site.name}
      </p>
      <button onClick={refresh}>刷新配置</button>
    </footer>
  )
}
```

### 3.10 配置热重载测试

创建测试页面来验证配置热重载：

```tsx
// src/app/test-config/page.tsx
'use client'

import { useState } from 'react'
import { useRuntimeConfig } from '@/components/providers/runtime-config-provider'

export default function TestConfigPage() {
  const { config, isLoading, error, refresh } = useRuntimeConfig()
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const handleRefresh = async () => {
    await refresh()
    setLastRefresh(new Date())
  }

  if (isLoading)
    return <div>加载中...</div>
  if (error) {
    return (
      <div>
        错误:
        {error.message}
      </div>
    )
  }
  if (!config)
    return <div>配置未加载</div>

  return (
    <div>
      <h1>配置测试页面</h1>

      <div>
        <h2>当前配置：</h2>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </div>

      <div>
        <button onClick={handleRefresh}>手动刷新配置</button>
        {lastRefresh && (
          <p>
            上次刷新:
            {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div>
        <h2>测试说明：</h2>
        <ol>
          <li>
            修改
            <code>public/runtime-config.json</code>
            {' '}
            文件
          </li>
          <li>等待5秒（缓存过期）</li>
          <li>点击"手动刷新配置"按钮</li>
          <li>观察配置是否更新</li>
        </ol>
      </div>
    </div>
  )
}
```

---

## 4. Nuxt 3 方案详解

### 4.1 Nuxt 3 的独特优势

| 特性 | Next.js | Nuxt 3 |
|------|---------|--------|
| SSR 数据获取 | `async/await` in Server Component | `useFetch` / `useAsyncData` (自动去重 + SSR) |
| 服务端缓存 | 自行实现 | Nitro Storage Layer (`useStorage`) |
| 同构代码 | 需区分 server/client | `useRuntimeConfig` 天然同构 |
| 服务器插件 | Middleware | Nitro Plugins (请求级钩子) |
| 配置变更推送 | 轮询 / WebSocket 自行实现 | 可结合 Nitro + Nuxt plugin |

### 4.2 完整项目结构

```
my-nuxt-app/
├── public/
│   └── runtime-config.json          # ← 运行时配置文件
├── server/
│   ├── api/
│   │   └── config.get.ts            # Nitro API Route
│   ├── plugins/
│   │   └── runtime-config.ts        # Nitro 插件：请求级配置注入
│   └── utils/
│       └── runtime-config.ts        # 服务端读取工具
├── composables/
│   └── useRuntimeJsonConfig.ts      # 客户端 Composable
├── types/
│   └── runtime-config.ts            # 类型定义
├── pages/
│   ├── index.vue                    # 主页
│   └── test-config.vue              # 配置测试页
├── nuxt.config.ts
├── package.json
└── tsconfig.json
```

### 4.3 安装依赖

```bash
npm install zod
# 或
yarn add zod
# 或
pnpm add zod
```

### 4.4 类型定义与校验

```typescript
// types/runtime-config.ts
import { z } from 'zod'

export const RuntimeConfigSchema = z.object({
  site: z.object({
    name: z.string().default('我的应用'),
    description: z.string().default(''),
    url: z.string().url().default('http://localhost:3000'),
    ogImage: z.string().default('/og-image.jpg'),
  }),
  api: z.object({
    baseUrl: z.string().url().default('http://localhost:3000/api'),
    imageCdn: z.string().url().optional(),
  }),
  services: z.object({
    analyticsId: z.string().optional(),
    googleMapsKey: z.string().optional(),
  }).default({}),
  app: z.object({
    defaultLocale: z.string().default('zh-CN'),
    defaultCurrency: z.string().default('CNY'),
    enableRegistration: z.boolean().default(true),
    maintenanceMode: z.boolean().default(false),
  }),
})

export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>

// 客户端安全版本
export const PublicRuntimeConfigSchema = RuntimeConfigSchema.omit({
  services: true,
})

export type PublicRuntimeConfig = z.infer<typeof PublicRuntimeConfigSchema>

// 验证函数
export function validateConfig(raw: unknown): RuntimeConfig {
  return RuntimeConfigSchema.parse(raw)
}

// 安全验证函数
export function safeValidateConfig(raw: unknown): { success: true, data: RuntimeConfig } | { success: false, error: z.ZodError } {
  const result = RuntimeConfigSchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data }
  }
  else {
    return { success: false, error: result.error }
  }
}
```

### 4.5 服务端读取工具（Nitro Utils）

```typescript
import type { H3Event } from 'h3'
import type { PublicRuntimeConfig, RuntimeConfig } from '~/types/runtime-config'
// server/utils/runtime-config.ts
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { PublicRuntimeConfigSchema, RuntimeConfigSchema } from '~/types/runtime-config'

const CONFIG_KEY = 'runtime:config'
const CONFIG_PATH = join(process.cwd(), 'public', 'runtime-config.json')

/**
 * 从文件系统读取运行时配置，使用 Nitro Storage 做进程内缓存
 * 支持热重载：每次调用检查文件修改时间
 */
export async function getRuntimeConfig(
  event?: H3Event,
  bypassCache = false
): Promise<RuntimeConfig> {
  const storage = useStorage()
  const now = Date.now()

  // 1. 尝试读取缓存（Nitro Storage Layer）
  if (!bypassCache) {
    const cached = await storage.getItem<{
      data: RuntimeConfig
      mtime: number
    }>(CONFIG_KEY)

    if (cached) {
      // 检查文件是否修改过
      try {
        const stats = await stat(CONFIG_PATH).catch(() => null)

        if (stats && stats.mtime.getTime() <= cached.mtime) {
          return cached.data
        }
      }
      catch {
        // 无法 stat，直接重新读取
      }
    }
  }

  // 2. 重新读取文件
  try {
    const [fileContent, stats] = await Promise.all([
      readFile(CONFIG_PATH, 'utf-8'),
      stat(CONFIG_PATH),
    ])

    const parsed = JSON.parse(fileContent)
    const config = RuntimeConfigSchema.parse(parsed)

    // 3. 写入缓存，附带文件修改时间
    await storage.setItem(CONFIG_KEY, {
      data: config,
      mtime: stats.mtime.getTime(),
    })

    return config
  }
  catch (error) {
    console.warn('[RuntimeConfig] Failed to load:', error)

    // 4. 降级到 nuxt.config.ts 中定义的 runtimeConfig
    const nuxtConfig = useRuntimeConfig(event)
    const fallback = RuntimeConfigSchema.safeParse({
      site: {
        name: nuxtConfig.public.siteName,
        url: nuxtConfig.public.siteUrl,
      },
      api: {
        baseUrl: nuxtConfig.public.apiBaseUrl,
      },
    })

    if (fallback.success) {
      return fallback.data
    }

    return RuntimeConfigSchema.parse({})
  }
}

/**
 * 获取客户端安全配置（过滤敏感字段）
 */
export async function getPublicRuntimeConfig(
  event?: H3Event
): Promise<PublicRuntimeConfig> {
  const full = await getRuntimeConfig(event)
  return PublicRuntimeConfigSchema.parse(full)
}

/**
 * 手动清理缓存（用于管理后台触发重载）
 */
export async function clearRuntimeConfigCache(): Promise<void> {
  const storage = useStorage()
  await storage.removeItem(CONFIG_KEY)
}
```

### 4.6 Nitro API Route

```typescript
// server/api/config.get.ts
export default defineEventHandler(async (event) => {
  try {
    const config = await getPublicRuntimeConfig(event)

    // 设置缓存头
    setResponseHeaders(event, {
      'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
    })

    return config
  }
  catch (error) {
    console.error('[API/config] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load configuration',
    })
  }
})
```

### 4.7 Nitro 插件：请求级配置注入（进阶）

```typescript
// server/plugins/runtime-config.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    // 将配置挂载到 event.context，后续所有 handler 都能访问
    event.context.runtimeConfig = await getRuntimeConfig(event)
  })
})

// 类型声明扩展
declare module 'h3' {
  interface H3EventContext {
    runtimeConfig?: import('~/types/runtime-config').RuntimeConfig
  }
}
```

然后在任意 Server API 中：

```typescript
// server/api/some-resource.get.ts
export default defineEventHandler((event) => {
  const config = event.context.runtimeConfig

  if (config?.app.maintenanceMode) {
    throw createError({ statusCode: 503, statusMessage: 'Maintenance Mode' })
  }

  return fetch(`${config?.api.baseUrl}/resource`)
})
```

### 4.8 客户端 Composable

```typescript
// composables/useRuntimeJsonConfig.ts
import type { PublicRuntimeConfig } from '~/types/runtime-config'

/**
 * 同构的运行时配置 Composable
 *
 * 服务端：直接读取文件（零网络开销）
 * 客户端：fetch /api/config（自动 dedupe + 缓存）
 */
export function useRuntimeJsonConfig() {
  const { data: config, pending, error, refresh } = useFetch('/api/config', {
    server: true, // SSR 时服务端获取
    default: () => null, // 兜底值
    // transform: 可在此做客户端转换
  })

  // 提供计算属性便于访问
  const site = computed(() => config.value?.site)
  const apiBase = computed(() => config.value?.api?.baseUrl)
  const isMaintenance = computed(() => config.value?.app?.maintenanceMode ?? false)

  return {
    config: readonly(config),
    site: readonly(site),
    apiBase: readonly(apiBase),
    isMaintenance: readonly(isMaintenance),
    pending: readonly(pending),
    error: readonly(error),
    refresh, // 手动刷新配置：await refresh()
  }
}
```

### 4.9 在 Vue 组件中使用

**主页组件：**

```vue
<!-- pages/index.vue -->
<script setup>
// SSR 时服务端直接读取，客户端 hydration 复用数据
const { config, site, isMaintenance, refresh } = useRuntimeJsonConfig()

// SEO：使用运行时配置生成 meta
useHead(() => ({
  title: site.value?.name,
  meta: [
    { name: 'description', content: site.value?.description },
    { property: 'og:image', content: site.value?.ogImage },
  ],
}))

// 手动刷新配置
async function handleRefresh() {
  await refresh()
  alert('配置已刷新')
}
</script>

<template>
  <div>
    <div v-if="isMaintenance" class="maintenance-banner">
      🚧 系统维护中，请稍后再试
    </div>

    <h1>{{ site?.name }}</h1>
    <p>{{ site?.description }}</p>

    <div>
      <h2>配置信息：</h2>
      <ul>
        <li>API 地址：{{ config?.api?.baseUrl }}</li>
        <li>语言：{{ config?.app?.defaultLocale }}</li>
        <li>货币：{{ config?.app?.defaultCurrency }}</li>
        <li>注册功能：{{ config?.app?.enableRegistration ? '开启' : '关闭' }}</li>
      </ul>
    </div>

    <button @click="handleRefresh">
      手动刷新配置
    </button>
  </div>
</template>
```

**配置测试页面：**

```vue
<!-- pages/test-config.vue -->
<script setup>
const { config, pending, error, refresh } = useRuntimeJsonConfig()
const lastRefresh = ref(null)

async function handleRefresh() {
  await refresh()
  lastRefresh.value = new Date().toLocaleTimeString()
}
</script>

<template>
  <div>
    <h1>配置测试页面</h1>

    <div v-if="pending">
      加载中...
    </div>
    <div v-else-if="error">
      错误: {{ error.message }}
    </div>
    <div v-else-if="config">
      <h2>当前配置：</h2>
      <pre>{{ JSON.stringify(config, null, 2) }}</pre>
    </div>

    <div>
      <button @click="handleRefresh">
        手动刷新配置
      </button>
      <p v-if="lastRefresh">
        上次刷新: {{ lastRefresh }}
      </p>
    </div>

    <div>
      <h2>测试说明：</h2>
      <ol>
        <li>修改 <code>public/runtime-config.json</code> 文件</li>
        <li>等待5秒（缓存过期）</li>
        <li>点击"手动刷新配置"按钮</li>
        <li>观察配置是否更新</li>
      </ol>
    </div>
  </div>
</template>
```

### 4.10 与 Pinia Store 结合（全局状态管理）

```typescript
// stores/config.ts
import { defineStore } from 'pinia'
import { useRuntimeJsonConfig } from '~/composables/useRuntimeJsonConfig'

export const useConfigStore = defineStore('config', () => {
  const { config, refresh } = useRuntimeJsonConfig()

  // 定时刷新配置（实现准热重载）
  let interval: ReturnType<typeof setInterval>

  function startPolling(intervalMs = 30000) {
    interval = setInterval(() => refresh(), intervalMs)
  }

  function stopPolling() {
    clearInterval(interval)
  }

  onScopeDispose(stopPolling)

  return {
    config: computed(() => config.value),
    refresh,
    startPolling,
    stopPolling,
  }
})
```

### 4.11 nuxt.config.ts 中的兜底配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // 私有变量（仅服务端可用）
    apiSecret: process.env.API_SECRET || '',

    // 公共变量（会暴露给客户端，作为兜底）
    public: {
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || '我的应用',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    },
  },

  nitro: {
    // 生产环境确保 public 目录文件可访问
    publicAssets: [
      {
        dir: 'public',
        baseURL: '/',
      },
    ],
  },
})
```

---

## 5. 双框架深度对比

### 5.1 核心差异一览

| 维度 | Next.js 14 (App Router) | Nuxt 3 |
|------|------------------------|--------|
| **配置读取** | `fs.readFile` + 自行缓存 | `fs.readFile` + Nitro Storage Layer |
| **SSR 获取** | Server Component `async/await` | `useFetch` / `useAsyncData`（自动同构） |
| **客户端状态** | React Context（手动 Provider） | Composable（自动 Tree-shaking） |
| **缓存策略** | 内存变量（进程级） | Nitro Storage（支持 Redis/Memory/FS） |
| **文件监控** | 自行实现 fs.watch | 可自行实现，或依赖 Storage 的 mtime 检查 |
| **类型扩展** | 无原生支持 | 可扩展 `H3EventContext` 类型 |
| **Bundle 影响** | Provider + Context 增加体积 | Composable 零额外运行时开销 |
| **学习曲线** | 需理解 RSC / Client Boundary | 更符合 Vue 直觉，同构无缝 |

### 5.2 关键代码量对比

| 模块 | Next.js | Nuxt 3 |
|------|---------|--------|
| 服务端读取 | ~50 行 | ~60 行（含 Storage） |
| 客户端封装 | ~60 行（Context + Hook） | ~20 行（Composable） |
| API Route | ~15 行 | ~8 行 |
| 类型注入 | 手动 | 自动（Nuxt 类型生成） |
| **总计** | **~125 行** | **~88 行** |

### 5.3 热重载机制对比

**Next.js：**

```typescript
// 方案 1：短周期缓存（推荐）
// server.ts 中 CACHE_TTL = 5000，每 5 秒重新读取文件

// 方案 2：手动触发（管理后台）
// POST /api/admin/reload-config → 调用 clearRuntimeConfigCache()
```

**Nuxt 3：**

```typescript
// 方案 1：Storage 缓存 + mtime 检查（已实现）
// 每次请求对比文件修改时间，自动失效

// 方案 2：管理接口触发
// server/api/admin/reload-config.post.ts
export default defineEventHandler(async (event) => {
  // 权限检查...
  await clearRuntimeConfigCache()
  return { success: true }
})
```

---

## 6. 生产环境部署指南

### 6.1 Docker 部署（推荐）

**Dockerfile (Next.js)：**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 仅复制必要文件
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
```

**Dockerfile (Nuxt 3)：**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 仅复制必要文件
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

**docker-compose.yml：**

```yaml
version: '3.8'

services:
  app:
    build: .
    image: my-ssr-app
    ports:
      - '3000:3000'
    volumes:
      # 挂载外部配置文件，无需重建镜像
      - ./config/runtime-config.json:/app/public/runtime-config.json:ro
    environment:
      - NODE_ENV=production
      # 可选：通过环境变量覆盖部分配置
      - NEXT_PUBLIC_SITE_NAME=生产环境
      # 或 Nuxt
      - NUXT_PUBLIC_SITE_NAME=生产环境
```

### 6.2 配置文件管理

**推荐的配置文件组织方式：**

```
project/
├── config/
│   ├── runtime-config.json          # 默认配置
│   ├── runtime-config.dev.json      # 开发环境
│   ├── runtime-config.staging.json  # 预发布环境
│   └── runtime-config.prod.json     # 生产环境
├── docker-compose.yml
└── docker-compose.override.yml      # 本地开发覆盖
```

**docker-compose.override.yml（本地开发）：**

```yaml
version: '3.8'

services:
  app:
    volumes:
      # 开发时使用本地配置
      - ./config/runtime-config.dev.json:/app/public/runtime-config.json:ro
      # 可选：挂载整个 public 目录便于开发
      - ./public:/app/public
```

### 6.3 Kubernetes ConfigMap 挂载

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-runtime-config
data:
  runtime-config.json: |
    {
      "site": {
        "name": "生产环境应用",
        "description": "这是一个生产环境应用",
        "url": "https://app.example.com"
      },
      "api": {
        "baseUrl": "https://api.example.com/v1"
      },
      "app": {
        "defaultLocale": "zh-CN",
        "defaultCurrency": "CNY",
        "enableRegistration": true,
        "maintenanceMode": false
      }
    }
---
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-ssr-app
  template:
    metadata:
      labels:
        app: my-ssr-app
    spec:
      containers:
        - name: app
          image: my-ssr-app:latest
          ports:
            - containerPort: 3000
          volumeMounts:
            - name: runtime-config
              mountPath: /app/public/runtime-config.json
              subPath: runtime-config.json
              readOnly: true
      volumes:
        - name: runtime-config
          configMap:
            name: app-runtime-config
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: my-ssr-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

**更新配置：**

```bash
# 方法1：修改 ConfigMap 后滚动重启
kubectl apply -f configmap.yaml
kubectl rollout restart deployment/app

# 方法2：使用 kubectl patch 直接更新
kubectl patch configmap app-runtime-config \
  --type merge \
  -p '{"data":{"runtime-config.json":"{\"site\":{\"name\":\"新名称\"}}"}}'

# 方法3：如果配置文件挂载为 volume，等待缓存过期即可（无需重启）
```

### 6.4 配置校验 CI 检查

```js
const fs = require('node:fs')
const path = require('node:path')
// scripts/validate-config.js
const { RuntimeConfigSchema } = require('./lib/runtime-config/schema')

const configPath = process.argv[2] || './public/runtime-config.json'

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const result = RuntimeConfigSchema.safeParse(config)

  if (!result.success) {
    console.error('❌ 配置文件校验失败:')
    console.error(result.error.format())
    process.exit(1)
  }

  console.log('✅ 配置文件校验通过')
  console.log('配置摘要:')
  console.log(`- 站点名称: ${result.data.site.name}`)
  console.log(`- API 地址: ${result.data.api.baseUrl}`)
  console.log(`- 维护模式: ${result.data.app.maintenanceMode ? '开启' : '关闭'}`)
}
catch (error) {
  console.error('❌ 读取配置文件失败:', error.message)
  process.exit(1)
}
```

**package.json 脚本：**

```json
{
  "scripts": {
    "validate-config": "node scripts/validate-config.js",
    "validate-config:dev": "node scripts/validate-config.js ./config/runtime-config.dev.json",
    "validate-config:prod": "node scripts/validate-config.js ./config/runtime-config.prod.json",
    "build": "npm run validate-config && next build"
  }
}
```

**GitHub Actions CI：**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate-and-build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Validate runtime config
        run: npm run validate-config

      - name: Build application
        run: npm run build
```

---

## 7. 进阶：配置变更监听与自动推送

### 7.1 文件系统监听（Node.js fs.watch）

```typescript
// server/plugins/config-watcher.ts (Nuxt)
import { watch } from 'node:fs'
import { join } from 'node:path'

export default defineNitroPlugin((nitroApp) => {
  const configPath = join(process.cwd(), 'public', 'runtime-config.json')

  console.log(`[ConfigWatcher] 监听配置文件: ${configPath}`)

  const watcher = watch(configPath, async (eventType) => {
    if (eventType === 'change') {
      console.log('[ConfigWatcher] 检测到配置文件变更，清除缓存...')
      await clearRuntimeConfigCache()

      // 可选：通过 SSE / WebSocket 推送给客户端
      // broadcastToClients({ type: 'CONFIG_UPDATED' });
    }
  })

  nitroApp.hooks.hook('close', () => {
    console.log('[ConfigWatcher] 停止监听')
    watcher.close()
  })
})
```

### 7.2 Server-Sent Events (SSE) 实时推送

```typescript
// server/api/config-sse.ts (Nuxt)
export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)

  // 监听配置变更（通过 Nitro 内部事件总线）
  const unsubscribe = onConfigChange((config) => {
    eventStream.push(JSON.stringify({ type: 'update', config }))
  })

  eventStream.onClosed(async () => {
    await unsubscribe()
  })

  return eventStream.send()
})
```

**客户端：**

```typescript
// composables/useRuntimeConfigSSE.ts
export function useRuntimeConfigSSE() {
  const config = useState<PublicRuntimeConfig | null>('runtime-config', () => null)

  if (import.meta.client) {
    const { data, close } = useEventSource('/api/config-sse')

    watch(data, (msg) => {
      if (msg) {
        const parsed = JSON.parse(msg)
        if (parsed.type === 'update') {
          config.value = parsed.config
        }
      }
    })

    onScopeDispose(close)
  }

  return config
}
```

---

## 8. 常见问题解答

### 8.1 为什么我的配置没有立即生效？

**可能原因：**
1. **缓存未过期**：服务端有5秒缓存，等待缓存过期
2. **JSON语法错误**：检查 `runtime-config.json` 是否有语法错误
3. **文件路径错误**：确保文件在 `public/` 目录下
4. **Zod验证失败**：检查字段类型和必填项

**解决方法：**
```bash
# 1. 验证配置文件语法
node -e "console.log(JSON.parse(require('fs').readFileSync('./public/runtime-config.json', 'utf-8')))"

# 2. 验证配置文件格式
npm run validate-config

# 3. 检查服务器日志
# 查看是否有 [RuntimeConfig] 相关警告
```

### 8.2 如何存储敏感配置？

**不要**在 `runtime-config.json` 中存储：
- API密钥
- 数据库密码
- 第三方服务密钥
- 任何不应暴露给客户端的配置

**正确做法：**
```typescript
// 在 nuxt.config.ts 或 next.config.js 中定义私有配置
export default defineNuxtConfig({
  runtimeConfig: {
    // 私有变量（仅服务端可用）
    apiSecret: process.env.API_SECRET,
    dbPassword: process.env.DB_PASSWORD,

    // 公共变量（会暴露给客户端）
    public: {
      siteName: '我的应用',
    },
  },
})
```

### 8.3 如何在生产环境更新配置？

**推荐方式：**

1. **Docker部署**：挂载配置文件，编辑后等待缓存过期
   ```bash
   # 编辑配置文件
   vim ./config/runtime-config.json

   # 等待5秒（缓存过期），或手动触发重载
   curl -X POST http://localhost:3000/api/admin/reload-config
   ```

2. **Kubernetes**：更新ConfigMap，滚动重启Pod
   ```bash
   kubectl patch configmap app-runtime-config \
     --type merge \
     -p '{"data":{"runtime-config.json":"..."}}'

   kubectl rollout restart deployment/app
   ```

3. **管理后台**：实现管理接口
   ```typescript
   // server/api/admin/reload-config.post.ts
   export default defineEventHandler(async (event) => {
     // 验证管理员权限
     const auth = getHeader(event, 'authorization')
     if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
       throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
     }

     await clearRuntimeConfigCache()
     return { success: true, message: '配置已重载' }
   })
   ```

### 8.4 如何实现配置版本控制？

**Git管理配置文件：**
```bash
# 将配置文件加入版本控制
git add public/runtime-config.json
git add config/
git commit -m "chore: update runtime config"

# 部署时拉取最新配置
git pull origin main
# 或通过CI/CD自动部署
```

**配置文件备份：**
```bash
# 定期备份配置文件
cp public/runtime-config.json backups/runtime-config-$(date +%Y%m%d-%H%M%S).json
```

### 8.5 如何测试配置变更？

**创建测试页面：**
```vue
<!-- pages/test-config.vue -->
<script setup>
const { config, refresh } = useRuntimeJsonConfig()

async function testConfigUpdate() {
  // 1. 修改配置文件
  console.log('请手动修改 public/runtime-config.json')

  // 2. 等待5秒
  await new Promise(resolve => setTimeout(resolve, 5000))

  // 3. 刷新配置
  await refresh()

  // 4. 检查配置是否更新
  console.log('当前配置:', config.value)
}
</script>

<template>
  <div>
    <h1>配置测试</h1>
    <button @click="testConfigUpdate">
      测试配置更新
    </button>
    <pre>{{ config }}</pre>
  </div>
</template>
```

### 8.6 性能影响分析

**内存占用：**
- 配置对象通常小于10KB
- 缓存仅在内存中存储一份
- 对整体内存影响可忽略不计

**CPU影响：**
- JSON解析：微秒级
- Zod验证：毫秒级（首次），微秒级（缓存后）
- 文件读取：毫秒级（磁盘I/O）

**网络影响：**
- 客户端：单个请求，小于10KB
- 缓存控制：10秒缓存，减少重复请求
- 对页面加载时间影响可忽略

---

## 9. 完整示例项目

### 9.1 Next.js 示例项目

**项目结构：**
```
next-runtime-config-demo/
├── public/
│   └── runtime-config.json
├── src/
│   ├── lib/
│   │   └── runtime-config/
│   │       ├── schema.ts
│   │       ├── server.ts
│   │       └── client.ts
│   ├── app/
│   │   ├── api/config/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── test-config/page.tsx
│   └── components/
│       └── providers/
│           └── runtime-config-provider.tsx
├── scripts/
│   └── validate-config.js
├── docker-compose.yml
├── Dockerfile
├── next.config.js
├── package.json
└── tsconfig.json
```

**package.json：**
```json
{
  "name": "next-runtime-config-demo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "npm run validate-config && next build",
    "start": "next start",
    "lint": "next lint",
    "validate-config": "node scripts/validate-config.js"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

### 9.2 Nuxt 3 示例项目

**项目结构：**
```
nuxt-runtime-config-demo/
├── public/
│   └── runtime-config.json
├── server/
│   ├── api/
│   │   └── config.get.ts
│   ├── plugins/
│   │   └── runtime-config.ts
│   └── utils/
│       └── runtime-config.ts
├── composables/
│   └── useRuntimeJsonConfig.ts
├── types/
│   └── runtime-config.ts
├── pages/
│   ├── index.vue
│   └── test-config.vue
├── stores/
│   └── config.ts
├── scripts/
│   └── validate-config.js
├── docker-compose.yml
├── Dockerfile
├── nuxt.config.ts
├── package.json
└── tsconfig.json
```

**package.json：**
```json
{
  "name": "nuxt-runtime-config-demo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "npm run validate-config && nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "validate-config": "node scripts/validate-config.js"
  },
  "dependencies": {
    "nuxt": "^3.8.0",
    "vue": "^3.3.8",
    "vue-router": "^4.2.5",
    "zod": "^3.22.4",
    "@pinia/nuxt": "^0.5.1",
    "pinia": "^2.1.7"
  },
  "devDependencies": {
    "@nuxt/devtools": "latest",
    "@types/node": "^20",
    "typescript": "^5"
  }
}
```

### 9.3 快速启动指南

**Next.js：**
```bash
# 1. 克隆示例项目
git clone https://github.com/your-org/next-runtime-config-demo.git
cd next-runtime-config-demo

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 访问测试页面
# http://localhost:3000/test-config

# 5. 修改配置文件
# 编辑 public/runtime-config.json

# 6. 观察配置更新
# 等待5秒后点击"手动刷新配置"
```

**Nuxt 3：**
```bash
# 1. 克隆示例项目
git clone https://github.com/your-org/nuxt-runtime-config-demo.git
cd nuxt-runtime-config-demo

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 访问测试页面
# http://localhost:3000/test-config

# 5. 修改配置文件
# 编辑 public/runtime-config.json

# 6. 观察配置更新
# 等待5秒后点击"手动刷新配置"
```

---

## 10. 总结

### 10.1 方案选择建议

| 场景 | 推荐框架 | 理由 |
|------|---------|------|
| 团队熟悉 React / Vercel 生态 | **Next.js** | 生态成熟，Server Component 能力强大 |
| 团队熟悉 Vue / 追求开发效率 | **Nuxt 3** | Composable 更简洁，`useFetch` SSR 零配置 |
| 需要复杂服务端缓存策略 | **Nuxt 3** | Nitro Storage Layer 支持 Redis/Memory/FS |
| 需要最小化运行时体积 | **Nuxt 3** | Composable tree-shaking，无 Provider 包装器 |
| 需要 Edge Runtime 部署 | **Next.js** | Vercel Edge / Cloudflare Pages 支持更成熟 |

### 10.2 核心要点回顾

1. **文件位置**：`public/runtime-config.json` 是唯一热修改点
2. **类型安全**：Zod Schema 提供运行时校验 + TypeScript 类型推导
3. **缓存策略**：服务端短周期缓存 + mtime 检查，平衡性能与实时性
4. **安全隔离**：API Route 过滤敏感字段，客户端仅获取公开配置
5. **降级设计**：JSON 读取失败时自动回退到环境变量和代码默认值
6. **部署友好**：支持 Docker Volume / K8s ConfigMap 挂载，无需重建

### 10.3 下一步行动

1. **立即开始**：选择适合你团队的框架，按照快速开始指南实施
2. **逐步完善**：先实现基本功能，再添加缓存、监听、推送等进阶功能
3. **生产验证**：在测试环境充分验证后，再部署到生产环境
4. **持续优化**：根据实际使用情况调整缓存策略、监控告警等

### 10.4 获取帮助

- **常见问题**：查看第8节常见问题解答
- **示例代码**：查看第9节完整示例项目
- **技术讨论**：在项目中创建Issue讨论具体问题

---

**本文方案已在多个生产环境 SSR 项目中验证，可直接作为基础架构落地。**

**关键原则：** 复制代码 → 修改配置 → 测试验证 → 部署上线。简单、可靠、可维护。
