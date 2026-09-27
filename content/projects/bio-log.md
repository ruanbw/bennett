---
title: Bio Log — 肽类个人记录本 iOS App
description: local-first 的 SwiftUI 肽类记录 App。SwiftData 端侧存储 + StoreKit 2 双轨会员、U-100 针筒刻度化计算器、AI 归纳助手（Node.js/Vercel 代理），SSL 证书固定 + Keychain 零遥测，10 个 XCTest 套件与 xcconfig 构建期环境校验。
cover: /projects/images/bio-log-cover.webp
video: /projects/videos/bio-log.mp4
images:
  - /projects/images/bio-log-1.webp
  - /projects/images/bio-log-2.webp
  - /projects/images/bio-log-3.webp
tags:
  - SwiftUI
  - SwiftData
  - StoreKit 2
  - Node.js
  - Vercel
  - Supabase
date: 2026-09-27
---

Bio Log 是一款面向个人肽类方案的 **local-first iPhone 记录本**：所有临床记录、剂量、库存与化验
数据落在设备本地的 SwiftData 容器里，不上传、不打点。App 覆盖 12 个业务模块，后端只做
AI 归纳代理、StoreKit 2 收据校验和邀请码落地，不承载任何用户数据。

- **客户端**：`PeptideJournal/`（SwiftUI + SwiftData + 本地通知）
- **后端**：`backend/`（Node.js 22+ ESM，Vercel Serverless）
- **测试**：`PeptideJournalTests/`（10 个 XCTest 套件）+ `backend/test-security.mjs`

## 1. 端侧数据模型：把"记录"拆成可核对的刻度

产品的计量语言是**针筒刻度**。`SwiftData` 模型不是一张宽表，而是围绕一支肽的多个窄实体：

| 模型 | 记录什么 |
|---|---|
| `PeptideProfile` | 肽本身、分类、状态（active/paused/finished）、强调色 |
| `Reconstitution` | 重建记录（溶媒量、浓度） |
| `DoseLog` | 一次注射：剂量、抽取引数、日期时间、部位、针具、感受 |
| `InventoryRecord` | 库存变动与启封/效期 |

`Shared/DesignSystem.swift` 里的 `SyringeDoseGraphic` 把 `DoseLog.draw` 直接画成
**100 格 U-100 胰岛素针筒刻度**：主刻度 28px、次刻度 11px（2.5:1 比例与代码一致），
药液以青→紫渐变填充，2.5px 的剂量线落在对应单位上。`BodySiteMiniMap` 用 `Shape`
画出人体轮廓并按 `InjectionSite` 的九宫格坐标打点——部位轮换是这个产品
真正的使用摩擦点，所以它被做成了一个可复用的可视化组件，而不是一张列表。

## 2. 计算器：四个不查资料的答案

README 的功能清单列了四件事，界面上以 `DesignSystem.swift` 的
`CalculationCallout`（强调色圆形图标 + 标题 + `monospacedDigit` 数值）呈现：

1. **浓度**——溶媒量与肽量推出 mg/mL；
2. **U-100 针筒应抽单位数**——目标剂量 ÷ 浓度，换算成针筒刻度；
3. **瓶内剩余体积**；
4. **剩余可注射次数**。

数值格式化统一走 `Double.peptideFormatted`（`Locale(identifier: "en_US_POSIX")`，
最多两位小数），**强制以 `.` 为小数点**——避免不同区域设置下把
`0.5 mg` 显示成 `0,5 mg` 而在读数时产生歧义。

计算器页面本身还常驻一条来源声明：数值应按临床医生、药房或产品标签等
**可信来源**录入，App 不提供剂量建议。

## 3. 会员：StoreKit 2 + 邀请码双轨（按 3.1.1 重做过的支付设计）

`Services/SubscriptionService.swift` 的双轨是 **StoreKit 2 自动续期订阅**
加上**邀请码发放的 guest pass**，但真正值得写下来的是它**被推翻重做过**：

- 旧实现里有一个**纯本地生效的通用 `REVIEW30` 码**（无 `#if DEBUG` 保护），
  任何人都能白拿 30 天；另一个旧 RPC 允许 `reserved_reward_days`
  **无限叠加**，且受邀方解锁走的是自有机制（`vip_expires_at += 30 days`）。
  两者都违反 App Review Guideline 3.1.1。
- 现实现：奖励**改由 Apple offer code 兑换**（`GuestPassRedemption` 保存
  Apple offer code + `vipExpiresAt`），解锁路径回到 Apple 自己的机制；
  叠加改为**受限账本**——推荐人的奖励进 `reserved_reward_days` 银行，
  在他自己订阅结束后才开始生效，**年度上限 365 天**，且额度在写入前先算
  （30 天标准奖励下第 13 笔只给剩余 5 天，第 14 笔为 0）。
- 契约写在 `docs/REFERRAL_VIP_CONTRACT.md`，是"authoritative contract"：
  状态机、主备路径、失败模式、幂等的 `confirm_referral_redemption`
  都在里面。失败路径**必须返回而不是抛异常**——未捕获的 PostgreSQL 异常
  会回滚事务，连续失败计数就永远落不了库。
- 五次连续输错锁定 2 小时，且**输对也不解锁**（滑窗是有意为之）。
- 邀请页文案也按 3.2.2 改过：原来"下载即得 30 天"读起来像激励下载，
  现在是 "Your friend sent you a 1-month free pass" / "Redeem My Gift Code"。

收据校验不在客户端做——`backend/lib/apple-storekit-verifier.mjs` 用官方
`@apple/app-store-server-library` 在服务端验签，客户端只拿到结论。

## 4. AI 归纳：只读你自己的记录

`SafeAssistantView`（`App/RootTabView.swift`）不是聊天框，而是一个**受控的归纳入口**：

- 首次使用必须经过 `AI Data Sharing` 授权页，逐项列出发送目标、问题文本、
  最近记录范围，并明确"**不会自动发送**"、可在 Settings 撤销；
- 后端 `backend/api/assistant-v2.mjs` + `lib/openai-assistant.mjs` 是
  OpenAI 兼容代理，只透传 App 已授权的记录，不做检索；
- 界面常驻 `AIDisclaimerBanner`：不提供医疗建议、诊断、治疗或剂量指导。

后端其余部分只做三件事：StoreKit 验签、邀请链接（AASA + 落地页）、
以及 `lib/log-redaction.mjs` 的日志脱敏。

## 5. 隐私与安全：把边界写进构建

- **SSL/TLS 证书固定**：`PinnedURLSessionDelegate` 统一出网，订阅
  （`SubscriptionService`）、账号删除（`AccountDeletionService`）、
  AI 客户端（`OpenAIAssistantClient`）三个出网点都走它，
  `backend/lib/certs/` 是对应的固定证书。
- **端侧加密**：`Services/Security/KeychainSecurityService.swift` 保管令牌。
- **零遥测**：临床记录与剂量条目不进入任何分析事件；可分享的匿名统计是独立开关
  （`AnalyticsConfig.enabledDefaultsKey`）。
- **日志脱敏**：后端在写日志前统一过 `log-redaction.mjs`。

## 6. 工程化：让环境配错无法上线

三套 xcconfig（`Base / Dev / Staging / Release`）逐层覆盖，键值在构建期注入 `Info.plist`，
`AppEnvironment` 的读取优先级是 **环境变量 → Info.plist → SwiftPM 开发兜底**
（第三项不进 Xcode target，仅供 `swift test`）。

关键的一环是 `scripts/validate-env-config.sh` 作为 App target 的**第一个构建阶段**：
缺少必填项、或 **Release 构建指向 staging 后端/测试 Supabase**、
或 **Staging 构建指向生产后端/生产库**，直接**构建失败**。
把这类错误从"上线后才发现"提前到"编译不过"。

三套 scheme 各司其职：`PeptideJournal`（日常开发，走 staging 后端 + 本地
`BioLog.storekit`）、`BioLog Staging`（TestFlight，真实 StoreKit Sandbox）、
`Release`（App Store 归档）。

## 7. 宣传片

这支 50 秒横版宣传片由 `guizang-product-video-skill` 制作：画面里每一个界面像素
都是产品在 iOS 模拟器上的**真实渲染结果**（录屏 + App Store 正式截图），
外层排版取自 `DesignSystem.swift` 的真实设计值。视频工程在
`/Users/ruanbw/projects/bio-log-promo`，可复现重渲染。
