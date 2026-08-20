# PRD: NPM 包下载量统计 — 首页展示（ruanbw）

> 状态: 草案待评审 | 作者: Bennett Website | 日期: 2026-08-20
> 关联: 首页 app/pages/index.vue / 服务端 server/api/github

## 1. 背景与问题

- 账号 `ruanbw` 在 npmjs 上已发布 4 个公开包（https://www.npmjs.com/settings/ruanbw/packages），分别为
  `dsh-plugin-usage@0.2.0`, `pi-deepseek-cache@0.2.0`, `nodem-clean@1.2.1`, `jsvmp@1.0.0`。
  当前分散在 npmjs，无统一对外窗口，无法在个人站首页体现影响力。
- 首页 `app/pages/index.vue` 现仅有 `GithubProfileCard`，存在明显内容空白，缺少“作品/生态”区块。

目标：在首页新增「NPM 下载量总览」区块，一眼看到组织/个人影响力，并可下钻到单包。

成功指标：
- 首屏命中缓存时 < 200ms 渲染，冷启动 P95 < 800ms
- 零手动维护：新增发包后自动出现在首页（search 发现 + 白名单兜底）
- 点击直达 npm 包页

## 2. 术语

| 术语 | 定义 |
|---|---|
| maintainer:ruanbw | npm 账号 ruanbw 维护的包集合（本次数据源） |
| scope:xxx | npm 组织包（如 @bennett/*），本次 ruanbw 名下均为非 scope 包，设计需同时兼容 |
| Period | last-week / last-month / last-year，npm downloads API 的统计窗口 |

## 3. 范围

### MVP (本期)
- 服务端聚合接口 `GET /api/npm/stats`
- 首页新区块 `NpmDownloadsSection` + `NpmPackageCard`
- 展示：总包数、总下载（周/月）、单包卡片（名称/描述/版本/周/月下载，按周下载降序）
- 缓存、容错、空/错状态

### 非目标 (二期)
- 私有包、私有 registry
- 单包日级趋势图 / sparkline（需 range 接口）
- 周环比、下载排行榜页、按版本维度

## 4. 用户故事

1. 作为访客，打开首页能看到“共 4 个包 · 近一周 980 次 · 近一月 1,138 次”，并看到按热度排序的包卡片，点击跳 npm。
2. 作为维护者，只需发新包，无需改站即可自动收录；紧急时可通过环境变量白名单强行指定展示列表。

## 5. 数据源实测结论

已实测通过（2026-08-20）：

- 包发现：`GET https://registry.npmjs.org/-/v1/search?text=maintainer:ruanbw&size=100`
  返回 `{ objects:[{ package:{name,description,version,links.npm}, downloads:{weekly,monthly} }], total }`，实测 total=4。
  备选 `text=scope:xxx` 兼容未来的组织包；两查询可合并去重。

- 下载量（权威源）：`GET https://api.npmjs.org/downloads/point/last-week/{pkg}` 与 `/last-month/{pkg}`
  实测：
  - dsh-plugin-usage: week 875 / month 875
  - pi-deepseek-cache: week 93 / month 217
  - nodem-clean: week 11 / month 41
  - jsvmp: week 1 / month 5
  总计 week 980 / month 1138。
  注意 search 侧的 downloads 字段有延迟（search 显示 dsh 519 vs point 875），以 point API 为准。

- 批量：point API 不支持批量，需并发拉取。4 包 × 2 指标 = 8 请求，并发 5 可控。
- 限流：api.npmjs.org 匿名约 1k/min，需服务端聚合 + 缓存规避。

决策：包列表优先 search 动态发现，其次合并 `runtimeConfig.npmPackages` 手写白名单去重；下载量以 point API 为准。

## 6. 系统设计

```
[首页] useApi('/api/npm/stats')
   |
[Nitro] server/api/npm/stats.get.ts
   ├─ cachedEventHandler { maxAge 1h, staleMaxAge 24h, swr:true }
   ├─ Step1: fetch search (maintainer:ruanbw) + search(scope) + 白名单 → 去重包列表
   ├─ Step2: pLimit(5) 并发 fetch point/last-week & point/last-month，单包超时 5s，失败记 0
   ├─ Step3: totals = sum(downloads), packages sort by downloads.lastWeek desc
   └─ return { maintainer, updatedAt, totals, packages[] }
   |
[registry.npmjs.org + api.npmjs.org]
```

## 7. 接口设计

### GET /api/npm/stats

Query: 无（MVP 固定返回双指标）；预留 `period=last-week|last-month` 仅影响排序，已返回的双指标足够前端切换。

Response 200:
```ts
{
  maintainer: "ruanbw",
  updatedAt: "2026-08-20T17:53:00.000Z",
  totals: { packageCount: 4, lastWeek: 980, lastMonth: 1138 },
  packages: [
    {
      name: "dsh-plugin-usage",
      description: "Token usage statistics for DeepSeek Harness…",
      version: "0.2.0",
      npmUrl: "https://www.npmjs.com/package/dsh-plugin-usage",
      downloads: { lastWeek: 875, lastMonth: 875 }
    }
  ]
}
```

Error: 502 { statusCode: 502, statusMessage: "Failed to load npm stats" }，前端降级为 Empty + 重试按钮。

文件位置：`server/api/npm/stats.get.ts`，风格对齐 `server/api/github/[username].get.ts`（isLikelyPackageName 校验、headers、try/catch→createError）。

nuxt.config.ts 新增：
```ts
runtimeConfig: {
  npmMaintainer: process.env.NUXT_NPM_MAINTAINER || 'ruanbw',
  npmOrg: process.env.NUXT_NPM_ORG || '', // 可选，兼容未来 @scope
  npmPackages: process.env.NUXT_NPM_PACKAGES || '', // 逗号分隔白名单兜底
  githubToken: '',
}
```

## 8. 前端设计

### 8.1 信息架构

`app/pages/index.vue`:
```vue
<PageContainer>
  <GithubProfileCard username="ruanbw" />
  <NpmDownloadsSection class="mt-10" />
</PageContainer>
```

### 8.2 组件

- `app/components/NpmDownloadsSection.vue` 容器：useApi('/api/npm/stats') + 骨架屏 + 错误重试 + 周/月 Tab（前端重排，不重请求）
- `app/components/NpmPackageCard.vue` 单包卡片：包名链接、description 一行省略、version badge、lastWeek/lastMonth 紧凑数字 + hover 精确值 tooltip
- 顶部 Totals Bar：`4 个包 · 近一周 980 · 近一月 1,138`，大字号 Card
- 响应式：grid-cols-1 md:grid-cols-2 xl:grid-cols-3
- 空状态：ui/empty，文案“暂无公开包”
- 加载：rs-spinner + Skeleton 4 宫格
- 数字格式化：Intl.NumberFormat('zh-CN', { notation: 'compact' })  48291→48.3k，hover 显示全量

### 8.3 交互

- 卡片整卡可点，新标签跳 https://www.npmjs.com/package/{name}，rel=noopener
- Tab 切换周/月仅前端 sort，不发请求
- 失败态：文案“下载数据暂不可用” + 重试按钮（重新 useFetch）

### 8.4 样式与 i18n

- 复用 tailwind + shadcn/ui，不引入图表库
- locales 新增：
  zh: pages.npm.title="NPM 包下载量" totals="{count} 个包 · 近一周 {week} · 近一月 {month}" lastWeek="近一周" lastMonth="近一月" empty="暂无公开包"
  en: 同步

## 9. 非功能

- 性能：命中 Nitro 缓存 < 50ms；冷启动 8 并发 point + 1 search ≈ 600ms
- 缓存：Nitro cachedEventHandler maxAge 3600s, staleMaxAge 86400s, swr true；key 包含 maintainer+org
- 容错：单包失败记 0；search 失败回退白名单；全失败 502
- 安全：仅服务端请求 npm，无 token 泄露；包名校验 ^[a-z0-9._-]+$ + scope 正则
- SEO：区块为增强内容，不阻塞首屏；npm 链接加 rel=noopener
- 可观测：502 时 server warn + 前端 console.warn，便于后续接 Sentry

## 10. 埋点与运营（预留）

- 卡片点击 npm_click { package }
- 二期 OG Image 注入 totals

## 11. 迭代规划

- M1 MVP (1-2 天): server/api/npm/stats.get.ts + nuxt.config + NpmDownloadsSection/Card + index.vue 集成 + locales
- M2 增强: range 30 天趋势 sparkline、周环比、Nitro Cron 预热
- M3 运营: 埋点、OG、按 scope 分组

## 12. 验收标准

- [ ] 首页能看到 4 个包卡片，数据与 point API 一致，排序按周下载降序
- [ ] 总计显示 packageCount=4, lastWeek=980, lastMonth=1138（随时间浮动，允许 ±5%）
- [ ] 缓存命中二次刷新 < 200ms，刷新按钮可用
- [ ] 单包 point 失败不影响其他包展示
- [ ] 白名单配置 NUXT_NPM_PACKAGES 生效

## 13. 待确认

- 是否需要把 4 包以外的“组织包”也纳入（如未来 @ruanbw scope）？当前设计已兼容。
- 是否需要在 MVP 就展示 30 天趋势？建议放 M2。

## 14. 变更记录

- 2026-08-20 实测数据源并定稿本 PRD
