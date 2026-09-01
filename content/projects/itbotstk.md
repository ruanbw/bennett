---
title: Itbotstk — SHEIN 风格跨境电商
description: SHEIN 视觉复刻的普通商品零售跨境电商。Nuxt 4 SSR 双端组件独立壳层分流、静态复刻数据离线兜底防白屏、useCheckoutIdempotency 幂等结算、自研 @session/sdk 会话控制与 URL 状态驱动。
url: https://itbotstk.com/
cover: /projects/images/itbotstk-home.webp
video: /projects/videos/itbotstk.mp4
images:
  - /projects/images/itbotstk-list.webp
  - /projects/images/itbotstk-category.webp
  - /projects/images/itbotstk-product.webp
tags:
  - Nuxt 4
  - Vue 3
  - Tailwind CSS 3
  - reka-ui
  - FingerprintJS
  - PM2 Cluster
date: 2026-08-29
---

Itbotstk 是一套高保真复刻 SHEIN 视觉语言与购物体验的通用百货（General-Merchandise）电商用户端，基于 **Nuxt 4 SSR** 深度打造。系统作为 C 端消费者交互入口，与后端 Spring Boot 3.2.4 REST API 服务和 Vben Admin 管理平台组成完整闭环。

## 1. 渲染拓扑与双端架构策略

```
用户请求 ──HTTPS──► Nginx (itbotstk.com)
                     ├── /_nuxt/*        → 直接读磁盘 .output/public（30 天 Cache-Control immutable）
                     ├── /api/upload/*   → 管理端上传静态资源目录
                     ├── /api/**         → proxy_pass http://127.0.0.1:18300/（去 /api 前缀，直达 Spring Boot）
                     └── /*              → proxy_pass http://127.0.0.1:3100（PM2 / Nitro SSR）
                                                │ SSR 期间通过 NUXT_API_BASE_SERVER 内网直连后端
                                                ▼
                                          HTML + JSON Payload 极速水合（payloadExtraction）
```

### 1.1 双端策略：双份组件 + CSS 断点分流
与常规响应式布局折中处理不同，本项目实施了彻底的**双端隔离方案**（由仓库内 `SHEIN-双端调研报告.md` 决策支撑）：
- **组件成对分离**：`components/shein/desk-*` 专门负责桌面端宽屏展示，`mob-*` 负责移动端触摸流。页面级组件如 `pdp-page`（商品详情）、`cat-page`（类目）、`cart-page`（购物车）均具备独立双端实现；
- **壳层与断点控制**：`layouts/default.vue` 仅一套通用布局，通过 `hidden lg:block` 与 `lg:hidden` 分流渲染 `DeskHeader/DeskFooter` 与 `MobHeader/MobFooter/MobTabbar`；
- **收益权衡**：两端交互完全互不污染，移动端具备专属下拉抽屉、底部固定 TabBar 与吸底加购栏，复刻度极高；虽增加了少量 DOM 冗余，但换取了极佳的样式隔离与维护效率。

## 2. 前端分层与请求管线（Composables）

前端架构遵循清晰的单向数据流原则：

```
pages/（路由与数据编排）      useAsyncData / useApiFetch 编排落地页数据
   │                          如 product/[id].vue 支持 slug → id 双重回退
   ▼
components/shein/（视图层）   desk-*/mob-* 纯 props 响应式展示
   ▼
composables/（逻辑层）        useApi / useHomeData / useSheinCurrency / useCart
   │                          收敛公共 Header 计算、缓存 Key、货币换算等横切关注点
   ▼
api/（类型契约层）            member.ts / home.ts / brand.ts：仅声明 Vo 类型与 URL 辅助纯函数
   │                          （明确不发起请求，实现严格的类型与网络解耦）
   ▼
后端 Spring Boot API          返回 { data } 或原始对象，前端统一解包归一化
```

### 2.1 请求核心 `useApi.ts`
- **公共请求头自动注入（`useApiHeaders`）**：在 SSR 与客户端请求时，动态组装并透传：
  1. `Accept-Language`：优先使用当前 `@nuxtjs/i18n` 语言，支持 cookie 降级；
  2. `X-Currency`：由 `useSheinCurrency` 监听的全球结算货币代码；
  3. `X-Visitor-Id`：由 `plugins/visitor-id.client.ts` 初始化的 FingerprintJS 365 天设备持久指纹；
- **SSR 双 baseURL 兼容**：服务端渲染时使用内网 `http://127.0.0.1:18300` 直连，客户端使用公网代理 `/api`，消除 SSR 额外的公网 DNS 握手开销。

### 2.2 数据高可用：离线复刻兜底（`useHomeData.ts`）
首页核心接口（banners/categories/products）具备独立缓存 key（拼入 lang 标识保证语言切换刷新）。
当后端服务重启、网络波动或新环境数据未录入时，页面通过 `transform` 自动回退至 `utils/shein-replica-data.ts` **离线复刻数据集**，确保线上永不白屏，始终保持完整的 SHEIN 级视觉。

## 3. 核心电商交易与会话机制

- **下单幂等保障（`useCheckoutIdempotency.ts`）**：
  在进入结算页（`checkout.vue`）时生成全局唯一 `idempotencyKey`，提交订单时挂载于请求载荷，服务端结合 Redis 互斥锁拦截表单二次点击与网络抖动造成的重复扣款；
- **结算状态守卫（`useCheckoutGuard.ts`）**：
  前置校验会员登录态、收货地址有效性与库存预占状态，拦截非法直接输入 URL 触发的空结账流程；
- **购物车「加购意图」渐进消费（`useCart.ts`）**：
  未登录用户点击加购不强制跳转登录中断流程，而是将加购商品项作为「加购意图」暂存至 `sessionStorage`；待用户在任意时机完成登录/注册后，前端自动调起合并接口，实现静默同步；
- **实时会话控制（`useSessionControl.ts`）**：
  引入自研 `@session/sdk`，对全站多标签页、移动端多会话状态进行广播与生命周期管理；
- **个性化搜索词（`useSearchPlaceholder.ts`）**：
  基于访客设备指纹与历史搜索频次，动态生成顶部搜索栏滚动占位推荐词（Placeholder）。

## 4. 领域建模与 SSR 安全规范

- **严格的领域语言（CONTEXT.md）**：全站代码严禁混用术语，明确界定 **SPU**（可售商品标准单元 `t_product`）、**SKU**（多属性规格组合实体 `t_product_sku`）、**Category**（三级类目树）、**Brand**（独立商业品牌，全局唯一 slug）、**Cart Item**（包含数量与价格快照的独立行）；
- **URL 即唯一状态源（`useSheinFilter.ts`）**：
  所有列表页的属性筛选、价格区间、排序模式（default/hot/latest/price_asc/price_desc）全部同构映射至 URL Query。用户复制任意链接分享即可在异地设备精确还原筛选视图；
- **SSR 红线约束（CLAUDE.md）**：
  1. setup 顶层禁止调用任何 `window`/`document`/`localStorage`，所有浏览器 API 必须下沉至 `onMounted` 或客户端守卫；
  2. 富文本渲染（TipTap）与轮播（Swiper）一律使用 `<ClientOnly>` 包裹并给骨架屏 fallback；
  3. 模板中禁止直接使用 `Date.now()` 或 `Math.random()` 等动态值，防止水合不匹配（Hydration Mismatch）。

## 5. 生产运维与构建规范
- **构建输出**：`package.json` 中的 `build` 脚本配置为 `nuxt build && rm -f .output.zip && zip -r .output.zip .output`，一键输出压缩部署包；
- **PM2 生产集群**：`ecosystem.config.cjs` 启用 `instances: 'max'`，并通过 `--max-old-space-size=1024` 与 `max_memory_restart: '1G'` 杜绝 Node.js 内存泄漏。
