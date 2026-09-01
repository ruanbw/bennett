---
title: Pspeptide — 肽类跨境电商独立站
description: 生化科研肽类（Peptide）跨境电商独立站。Nuxt 4 SSR + Element Plus/Headless UI 前台，Spring Boot 3.3.4 + Sa-Token 双体系后端，支持 5 语种（含阿语）、分销佣金分润、SKU 规格矩阵与快捷 Token 结算。
url: https://pspeptide.com/
cover: /projects/images/pspeptide-home.webp
video: /projects/videos/pspeptide.mp4
images:
  - /projects/images/pspeptide-coa.webp
  - /projects/images/pspeptide-product.webp
  - /projects/images/pspeptide-cart.webp
tags:
  - Nuxt 4
  - Spring Boot 3.3.4
  - Element Plus
  - Headless UI
  - Sa-Token
  - MyBatis-Plus
  - Pinia
date: 2026-08-29
---

Pspeptide 是一套面向海外生化科研机构的高纯度多肽（Peptide）跨境电商独立站，具备完整的 COA 质检溯源、规格批次选择、分销佣金分润与快捷 Token 结算能力。项目由三个活跃子工程构成：

- **商城前台（C 端）**：`pspeptide-frontend`（Nuxt 4 SSR + Element Plus + Headless UI + Pinia）
- **管理后台（B 端）**：`pspeptide-admin`（Vue 3 + Vben Admin 5.7 monorepo + Ant Design Vue）
- **后端服务**：`pspeptide-backend`（Spring Boot 3.3.4 + Java 21 + MyBatis-Plus，49 张 `t_` 表）

## 1. 架构总览与流量拓扑

```
用户请求 ──HTTPS──► Nginx (pspeptide.com)
                     ├── /_nuxt/*        → 磁盘静态目录（30 天 Cache-Control immutable）
                     ├── /api/           → proxy_pass http://127.0.0.1:18300/（去 /api 前缀）
                     └── /*              → proxy_pass http://127.0.0.1:3100（PM2 Node.js SSR）
                                                │ SSR 数据请求直连同机后端
                                                ▼
                                    Spring Boot 3.3.4 (:18300)
                                       ├── MySQL 5.7（49 张实体表）
                                       ├── Redis（Sa-Token 双会话 / 邮件队列 / IP 缓存）
                                       ├── 阿里云 OSS（前端 Policy 签名直传）
                                       └── Resend（邮件平台）+ 阿里云 ALiMT（翻译）
```

**认证鉴权双轨隔离**：
- **后台管理**：基于 Sa-Token 的 RBAC 体系（路由根路径 `/`），权限由 `t_permission` 表持久化，通过 `PermissionController` 与 `/users/access` 动态下发前端路由与按钮级别授权码（`codes`），权限变更服务端即刻生效；
- **前台会员**：完全隔离的 `member/` 路径前缀（如 `MemberAuthController`、`MemberOrderController`），基于独立 Member 会话与 Redis 存储，天然杜绝普通会员越权触达运营接口。

## 2. 前台技术实现（pspeptide-frontend）

### 2.1 技术选型与多语言支持
前端采用 Nuxt 4 SSR，样式体系结合 `@nuxtjs/tailwindcss` 与 `@element-plus/nuxt`、`nuxt-headlessui`。

**国际化（@nuxtjs/i18n）**：支持 5 种语言——英语（`en`）、简体中文（`zh` / `zh-CN`）、繁体中文（`zh-TW`）以及**阿拉伯语（`ar`）**。针对阿拉伯语中东客群，页面布局支持 RTL 适配，文本与货币换算（USD/EUR/GBP 等）全部解耦驱动。

### 2.2 核心业务页面链路
源码 `pages/` 模块展现了针对高客单价生化制品的特定业务流：
- **COA 质检与商品详情**（`products/[id]/index.vue`）：针对生化试剂对纯度（Purity ≥98%）、质谱报告（MS）、高效液相色谱（HPLC）的严苛要求，实现第三方第三方检测报告（COA Testing）关联渲染及多规格选择状态机；
- **分销佣金与关系链**（`account/commission.vue`、`account/relations.vue`）：实现跨境分销体系，记录上级返佣、推广关联下线与返利提现流水；
- **售后流转体系**（`account/after-sales.vue`）：退换货与破损补发工单流转，提供凭证上传与双向进度追踪；
- **快捷 Token 结算落地页**（`checkout/[token].vue`）：支持由运营人员或邮件营销生成的限时预选 Token 链接，用户访问直接还原商品配置并进入收银台，缩短交易漏斗；
- **文化与资质背书**（`corporation-culture.vue`、`contact-us.vue`）：强化合规科研试剂定位，提供全球各区域合规准入说明。

## 3. 后端服务与核心业务机制（pspeptide-backend）

项目升级至 **Spring Boot 3.3.4**，代码结构按照单向依赖收敛在 `com.pspeptide` 命名空间下。

### 3.1 SKU 矩阵与规格联动
针对多肽产品多克隆、纯度不同、冻干粉多规格组合导致的 SKU 爆炸：
- 规格定义由 `CategoryController`、`ProductController` 支持笛卡尔积自动生成；
- **规格值图片联动**：图片绑定至特定规格属性值，当生成数十个 SKU 时，具备相同属性的 SKU 自动继承图片，显著降低录入成本；
- **多币种自动派生**：商品底价仅录入基准币种，系统根据 `CurrencyController` 汇率表自动生成各币种结算价格。

### 3.2 邮件活动与变量集编排
营销管线脱离单纯的 SDK 包装，自研完备的 Resend 邮件引擎：
- `EmailCampaignController`：受众分组、营销活动排期与触达记录；
- `EmailTemplateController`：支持 TipTap 富文本编辑的响应式邮件模板；
- `EmailTemplateVariableSetController`：**模板变量集引擎**，动态注入会员名、订单号、物流追踪号与个性化召回 Token，提供发送前实时预览与测试投递；
- 结合 Webhook 异步消费送达率、打开率与退订事件，防止域名被投落垃圾箱。

### 3.3 风控与拒卡分析
- **IP 情报审计**：`entity/ipinfo` 缓存全球访问者真实 ASN、机房代理标签与地理坐标，对高风险欺诈下单实时拦截；
- **拒卡原因管理（`card-reject-message`）**：在管理端维护各发卡行、网关常见拒付码（如 Do Not Honor、Insufficient Funds）的对外友好话术与内部审核策略。

## 4. 管理后台（pspeptide-admin）

后台基于 Vben Admin 5.7 monorepo 构建，涵盖 26 个核心运营域：
- **实时会话监控（`realtime-session`）**：运营可观察当前商城在线访客的浏览动向与停留深度；
- **全链路商品管理（`catalog` / `product` / `category`）**：商品上下架、规格模板库、类目关联绑定；
- **交易与物流（`order` / `shipping-method` / `shipping-rate` / `payment-method`）**：运费分区算费矩阵与支付通道动态权重分配；
- **发件域名配置（`sender-config`）**：多域名轮换发信，维持高送达评级。

## 5. 生产工程化规范
- **构建交付**：前端 PM2 集群（`ecosystem.config.cjs`，`instances: 'max'`），后端打出独立 Spring Boot jar，环境参数由外部 `application-prod.yml` 注入；
- **代码规范**：前端引入 `@antfu/eslint-config`，后端基于统一 `GlobalExceptionHandler` 输出规范错误结构 `{ code, message, data }`。
