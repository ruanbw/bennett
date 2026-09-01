---
title: Bsklux — 在线视频点播平台
description: 全球化在线视频点播（VOD）平台。短时签名防盗链、OpenResty 纯 Lua 动态改写 m3u8 与 cosocket 5秒热热控 CDN、FFmpeg 四档 ABR + AES-128 加密转码、双币池钱包与 5 分钟对账。
url: https://bsklux.com/
cover: /projects/images/bsklux-home.webp
video: /projects/videos/bsklux.mp4
images:
  - /projects/images/bsklux-1.webp
  - /projects/images/bsklux-2.webp
  - /projects/images/bsklux-3.webp
  - /projects/images/bsklux-4.webp
tags:
  - Spring Boot 3.2.5
  - Nuxt 4
  - OpenResty
  - Lua
  - FFmpeg
  - hls.js
  - 阿里云 OSS
date: 2026-08-29
---

Bsklux 是一个面向海外市场的在线视频点播（VOD）平台，采用「免费试看 + 金币解锁付费剧集」模式。架构核心在于将**鉴权控制面（Spring Boot）**与**媒体数据面（OpenResty + OSS + CDN）**彻底分离，确保高并发视频播放下后端不成为流量瓶颈。

代码仓库分为三端：
- **后端服务**：`video-play-backend`（Spring Boot 3.2.5 + Java 17 + MyBatis-Plus）
- **用户前端**：`video-play-frontend`（Nuxt 4.4 SSR + Vue 3 + hls.js 1.6 + shadcn-nuxt）
- **运营后台**：`video-play-admin`（Vue 3.5 + Vben Admin 5 monorepo + ant-design-vue）
- **媒体网关**：`docker/gateway`（定制 OpenResty 容器，内嵌自研纯 Lua 媒体代理模块）

## 1. 媒体分发硬核链路（核心架构亮点）

系统最突出的技术亮点在于自研的 **OpenResty 边缘安全网关**，由 6 个专职 Lua 模块驱动媒体数据面：

```
用户客户端 (hls.js)
   │
   ▼
[ 步骤 1: 业务鉴权 ]
Spring Boot (PlaybackAccessResolver)
   ├── 校验会员解锁状态 / 免费集数判定
   └── MediaUrlSigner 签发目录级短时签名 URL（HMAC-SHA256, TTL 300s）
   │
   ▼
[ 步骤 2: 媒体网关验签 ]
OpenResty (verify-hls.lua)
   ├── constant_time_equals 恒定时间比对签名（杜绝时序攻击 Timing Attack）
   ├── 校验 expiry 时间戳与 path 目录作用域
   └── 签名 URL 绝不记入 nginx access.log（防凭证泄漏）
   │
   ▼
[ 步骤 3: 播放列表动态改写与分流 ]
OpenResty (rewrite-hls.lua & feature-flags.lua)
   ├── 从 OSS 取回原始 master/index.m3u8 播放列表
   ├── 逐行精准改写：
   │    • 密钥行（#EXT-X-KEY:URI="enc.key"）→ 强制改写为网关签名绝对 URL，客户端必须走网关解密
   │    • 切片行（seg_*.ts）→
   │         ① 若 CDN 开启：由 cdn-auth.lua 生成阿里云 Type A 鉴权 URL 并直接分流
   │         ② 若 CDN 关闭/故障：保留相对路径，降级走网关自身 presign 回源 OSS
   │
   ▼
[ 步骤 4: 阿里云 OSS 回源 ]
OpenResty (oss-signing.lua)
   └── 纯 Lua 实现 AWS SigV4 算法，使用 AccessKey/SecretKey 计算 CanonicalRequest 预签名回源
```

### 1.1 Lua 层的深度工程优化
- **cosocket 5秒热拉取 CDN 开关（`feature-flags.lua`）**：
  OpenResty 无法直接读取动态变化的系统环境变量。网关利用 `ngx.timer.at` 与 `ngx.socket.tcp` cosocket 直连后端接口拉取 `media.cdn.enabled` 配置，存入跨 worker 共享的 `lua_shared_dict cdn_flags`。运维在管理端切换 CDN 开关，**≤5 秒全网关自动生效，无需 reload 或重启容器**，极大提高了故障降级响应速度；
- **阿里云 Type A 鉴权算法（`cdn-auth.lua`）**：
  在网关内根据 `<timestamp>-<rand>-0-<md5hash>` 规范动态签发分片直连 URL，既利用了 CDN 的边缘缓存优势，又严格保证了切片不会被未授权爬取。

## 2. 转码工程化：持久化任务状态机

转码子系统（`com.bennett.transcode`）基于 FFmpeg 打造工业级 ABR 加密流水线：
- **`DurableVideoTranscodeWorker`**：采用持久化数据库表状态机驱动（PENDING → RUNNING → COMPLETED / FAILED），配合租约加锁与 fencing token，防止后台多节点并发时同一视频被重复转码拉爆 CPU；
- **四档 ABR 码率梯队**：通过 `FfmpegCommandBuilder` 将上传的高清源片转码为 1080p / 720p / 480p / 360p 四组 HLS 切片流，并生成包含带宽协商信息的 `master.m3u8`；
- **AES-128 切片加密**：由 `EncryptionKeyManager` 为每部视频甚至单集生成专属 16 字节密钥与 IV，HLS 切片在转码输出时即被加密落盘；
- **断点续传与孤儿回收（`com.bennett.storage`）**：`ResumableUploadStorage` 与 `UploadSessionStateMachine` 配合处理大视频分片上传，支持会话对账；定时任务扫描回收超时孤儿切片。

## 3. 商业化与支付对账体系

平台面向全球 15 种货币与多种支付渠道：
- **`AbstractGatewayPayClient` 抽象**：标准化下发收银台、处理 Webhook 与查单，内置 `StarPayGatewayClient`（支持 Google Pay / PayPal / Visa）与开发环境 `MockGatewayPayClient`；
- **会员双币池模型**：会员钱包（`t_member_wallet`）拆分为**储值代币（充值购买）**与**奖励代币（活动赠送）**，解锁剧集时优先扣除带有效期的奖励代币；资金变动严格落库只增不改的资金流水（`t_fund_log`）；
- **对账闭环（`GatewayReconciliationScheduler`）**：每 5 分钟自动执行对账调度，主动向支付网关拉取终态凭证进行差错补单；
- **前端防御性查单**：支付结果页（`payment/result.vue`）不信任网关回跳前端携带的参数，一律以轮询后端接口确认入账状态为准。

## 4. 前端播放体验与防串号（video-play-frontend）

- **无感续签生命周期（`MediaAuthorizationLifecycle`）**：针对 300 秒短时签名，前端在播放器监听视频播放进度，在 URL 即将过期前 30 秒静默调用续签接口获取新签名并替换 hls.js 的 loader 上下文，遭遇 403 触发一次自动兜底重试，实现播放全程零卡顿；
- **防串号缓存隔离**：在 Nuxt SSR 服务端返回头中显式声明 `Cache-Control: private` 与 `Vary: Cookie`。由于视频网站存在大量游客建号（Guest Token）与会员权限，此举彻底避免了 CDN 反向代理误缓存包含个人登录态的页面 HTML；
- **15 语种全量国际化**：结合 `@nuxtjs/i18n`（`no_prefix` 模式）与后端 6 张 `*_i18n` 业务表，视频标题、长简介、分类标签等均由阿里云 ALiMT 批量机翻入库，提供纯正的本土化视听体验。
