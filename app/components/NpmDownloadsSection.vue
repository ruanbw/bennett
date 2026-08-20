<script setup lang="ts">
import type { NpmStatsPayload } from '~/server/api/npm/stats.get'

const props = withDefaults(defineProps<{
  lazy?: boolean
}>(), { lazy: false })

const active = ref<'week' | 'month'>('week')

const { data, pending, error, refresh } = await useFetch<NpmStatsPayload>(
  () => '/api/npm/stats',
  {
    key: 'npm-stats',
    lazy: props.lazy,
  },
)

function formatInt(n: number) {
  return new Intl.NumberFormat(undefined).format(n)
}
function formatCompact(n: number) {
  return new Intl.NumberFormat(undefined, { notation: n >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n)
}

const totals = computed(() => data.value?.totals ?? { packageCount: 0, lastWeek: 0, lastMonth: 0 })
const maxWeek = computed(() => Math.max(0, ...((data.value?.packages ?? []).map(p => p.downloads.lastWeek))))
const maxMonth = computed(() => Math.max(0, ...((data.value?.packages ?? []).map(p => p.downloads.lastMonth))))

const sortedPackages = computed(() => {
  const list = data.value?.packages ?? []
  const copy = [...list]
  if (active.value === 'month')
    copy.sort((a, b) => b.downloads.lastMonth - a.downloads.lastMonth)
  else
    copy.sort((a, b) => b.downloads.lastWeek - a.downloads.lastWeek)
  return copy
})

const updatedText = computed(() => {
  if (!data.value?.updatedAt)
    return ''
  try {
    return new Date(data.value.updatedAt).toLocaleString()
  }
  catch { return data.value.updatedAt }
})

const scopeLabel = computed(() => {
  if (data.value?.org)
    return `@${data.value.org}`
  if (data.value?.maintainer)
    return data.value.maintainer
  return 'ruanbw'
})
</script>

<template>
  <section
    class="npm-downloads-section @container relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
    :aria-busy="pending"
    aria-label="NPM 下载量总览"
  >
    <!-- 装饰：同 Github 卡片体系，偏冷青色与洋红点缀 -->
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-35"
      style="background:
        radial-gradient(900px 420px at 12% -8%, oklch(0.70 0.13 195 / 0.20), transparent 58%),
        radial-gradient(700px 360px at 102% 12%, oklch(0.72 0.14 325 / 0.14), transparent 56%),
        linear-gradient(to bottom, color-mix(in oklch, var(--border) 32%, transparent), transparent 42%);"
    />
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.10] dark:opacity-[0.08]"
      style="background-image: linear-gradient(color-mix(in oklch, var(--foreground) 18%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground) 18%, transparent) 1px, transparent 1px); background-size: 20px 20px;"
    />

    <div class="relative p-6 sm:p-8">
      <!-- Loading -->
      <div v-if="pending && !data" class="space-y-5" aria-hidden="true">
        <div class="space-y-2">
          <div class="h-3 w-28 rounded bg-muted motion-safe:animate-pulse" />
          <div class="flex items-baseline gap-3">
            <div class="h-10 w-40 rounded bg-muted motion-safe:animate-pulse" />
            <div class="h-4 w-24 rounded bg-muted motion-safe:animate-pulse" />
          </div>
          <div class="h-3 w-64 rounded bg-muted motion-safe:animate-pulse" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div class="h-36 rounded-xl bg-muted motion-safe:animate-pulse" />
          <div class="h-36 rounded-xl bg-muted motion-safe:animate-pulse" />
          <div class="h-36 rounded-xl bg-muted motion-safe:animate-pulse" />
          <div class="h-36 rounded-xl bg-muted motion-safe:animate-pulse" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="space-y-3" role="alert">
        <p class="text-lg font-semibold" style="font-family: 'Instrument Serif', ui-serif, serif;">
          暂时拉不到下载统计
        </p>
        <p class="max-w-prose text-sm text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
          {{ (error as any)?.statusMessage || (error as any)?.message || '请稍后再试。' }}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
            @click="refresh()"
          >
            重试
          </button>
          <a
            href="https://www.npmjs.com/settings/ruanbw/packages"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
          >
            去 NPM 看看
          </a>
        </div>
      </div>

      <!-- Data -->
      <div v-else-if="data" class="space-y-6">
        <!-- Header row -->
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              class="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
              style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
            >
              NPM · 下载量
            </h2>
            <p class="mt-1 text-sm text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              <a
                :href="`https://www.npmjs.com/~${encodeURIComponent(data.maintainer)}`"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-foreground/80"
              >{{ scopeLabel }}</a>
              共 {{ formatInt(totals.packageCount) }} 个公开包
              <span v-if="data.org" class="text-muted-foreground"> · 组织 {{ scopeLabel }}</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <!-- 周/月切换，仅前端重排 -->
            <div class="inline-flex rounded-full border border-border bg-muted/40 p-1 text-xs font-medium" role="tablist" aria-label="排序维度">
              <button
                type="button"
                role="tab"
                :aria-selected="active === 'week'"
                class="rounded-full px-3 py-1.5 leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="active === 'week' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'"
                @click="active = 'week'"
              >
                按周
              </button>
              <button
                type="button"
                role="tab"
                :aria-selected="active === 'month'"
                class="rounded-full px-3 py-1.5 leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="active === 'month' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'"
                @click="active = 'month'"
              >
                按月
              </button>
            </div>
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
              title="刷新"
              @click="refresh()"
            >
              <Icon name="carbon:renew" class="h-3.5 w-3.5" aria-hidden="true" />
              刷新
            </button>
          </div>
        </div>

        <!-- Totals hero -->
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-border bg-background/60 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/50 sm:col-span-1">
            <div class="text-xs tracking-wide text-muted-foreground uppercase" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              公开包
            </div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-semibold tabular-nums" style="font-family: 'Instrument Serif', ui-serif, serif;">{{ formatInt(totals.packageCount) }}</span>
              <span class="text-xs text-muted-foreground">个</span>
            </div>
          </div>
          <div class="rounded-xl border border-border bg-background/60 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/50">
            <div class="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              <Icon name="carbon:download" class="h-3.5 w-3.5" aria-hidden="true" />近一周
            </div>
            <div class="mt-1 flex items-baseline gap-1.5">
              <span class="text-2xl font-semibold tabular-nums" style="font-family: 'Instrument Serif', ui-serif, serif;" :title="formatInt(totals.lastWeek)">{{ formatCompact(totals.lastWeek) }}</span>
              <span class="text-xs text-muted-foreground" :title="formatInt(totals.lastWeek)">次</span>
              <span v-if="active === 'week'" class="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">排序中</span>
            </div>
          </div>
          <div class="rounded-xl border border-border bg-background/60 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/50">
            <div class="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              <Icon name="carbon:calendar" class="h-3.5 w-3.5" aria-hidden="true" />近一月
            </div>
            <div class="mt-1 flex items-baseline gap-1.5">
              <span class="text-2xl font-semibold tabular-nums" style="font-family: 'Instrument Serif', ui-serif, serif;" :title="formatInt(totals.lastMonth)">{{ formatCompact(totals.lastMonth) }}</span>
              <span class="text-xs text-muted-foreground" :title="formatInt(totals.lastMonth)">次</span>
              <span v-if="active === 'month'" class="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">排序中</span>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div
          v-if="!sortedPackages.length"
          class="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center"
        >
          <p class="text-sm font-medium text-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
            暂无公开包
          </p>
          <p class="mx-auto mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
            未发现该账号下的公开 NPM 包，或数据正在同步中。
          </p>
        </div>

        <!-- Grid -->
        <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <NpmPackageCard
            v-for="pkg in sortedPackages"
            :key="pkg.name"
            :pkg="pkg"
            :max-week="maxWeek"
            :max-month="maxMonth"
            :active="active"
          />
        </div>

        <!-- Footnote -->
        <p class="text-xs text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
          数据每小时缓存一次<span v-if="updatedText"> · 更新于 {{ updatedText }}</span> · 来源 registry.npmjs.org 与 api.npmjs.org，点卡片直达 npm。
          <span v-if="pending" class="inline-flex items-center gap-1"><Icon name="carbon:renew" class="h-3 w-3 motion-safe:animate-spin" aria-hidden="true" /> 更新中…</span>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
</style>
