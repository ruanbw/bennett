<script setup lang="ts">
/**
 * 展示「个人 + 所属组织」所有公开仓库（排除 fork）的 Star 总和。
 * 数据来自 GET /api/github/:username/stars
 */
export interface GithubStarsPayload {
  username: string
  totalStars: number
  totalRepos: number
  personalStars: number
  personalReposCount: number
  orgs: { login: string, stars: number, reposCount: number, totalReposCount: number, forkReposCount: number }[]
  orgCount: number
  excludeForks: boolean
  updatedAt: string
}

const props = withDefaults(defineProps<{
  username: string
  lazy?: boolean
}>(), { lazy: false })

const sanitized = computed(() => props.username.trim())

const { data, pending, error, refresh } = await useFetch<GithubStarsPayload>(
  () => `/api/github/${encodeURIComponent(sanitized.value)}/stars`,
  {
    key: () => `github-stars:${sanitized.value.toLowerCase()}`,
    lazy: props.lazy,
    watch: [sanitized],
  },
)

function formatInt(n: number) {
  return new Intl.NumberFormat(undefined).format(n)
}

const updatedText = computed(() => {
  if (!data.value?.updatedAt)
    return ''
  try {
    return new Date(data.value.updatedAt).toLocaleString()
  }
  catch { return data.value.updatedAt }
})
</script>

<template>
  <section
    class="github-stars-card @container relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
    :aria-busy="pending"
    aria-label="GitHub Stars 总览"
  >
    <!-- 装饰：与 GithubProfileCard 同系但更偏暖色，区分层次 -->
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-35"
      style="background:
        radial-gradient(900px 420px at 18% -8%, oklch(0.72 0.14 48 / 0.22), transparent 58%),
        radial-gradient(700px 360px at 102% 18%, oklch(0.68 0.12 250 / 0.16), transparent 56%),
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
            <div class="h-10 w-32 rounded bg-muted motion-safe:animate-pulse" />
            <div class="h-4 w-20 rounded bg-muted motion-safe:animate-pulse" />
          </div>
          <div class="h-3 w-56 rounded bg-muted motion-safe:animate-pulse" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="h-20 rounded-xl bg-muted motion-safe:animate-pulse" />
          <div class="h-20 rounded-xl bg-muted motion-safe:animate-pulse" />
        </div>
        <div class="h-2 w-full rounded bg-muted motion-safe:animate-pulse" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="space-y-3" role="alert">
        <p class="text-lg font-semibold" style="font-family: 'Instrument Serif', ui-serif, serif;">
          暂时拉不到 Star 统计
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
            :href="`https://github.com/${encodeURIComponent(sanitized)}`"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
          >
            去 GitHub 看看
          </a>
        </div>
      </div>

      <!-- Data -->
      <div v-else-if="data" class="space-y-6">
        <!-- Title row -->
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              class="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
              style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
            >
              Stars 总览 · 含组织
            </h2>
            <p class="mt-1 text-sm text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              统计
              <a :href="`https://github.com/${encodeURIComponent(data.username)}`" target="_blank" rel="noopener noreferrer" class="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-foreground/80">@{{ data.username }}</a>
              名下所有公开仓库<span v-if="data.excludeForks" class="text-muted-foreground">（已排除 fork）</span>与
              <span class="font-medium text-foreground">{{ data.orgCount }}</span>
              个公开组织的公开仓库
            </p>
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

        <!-- Hero total -->
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <div class="flex items-baseline gap-2">
            <span class="inline-flex items-center gap-1.5 text-amber-500 dark:text-amber-400" aria-hidden="true">
              <Icon name="carbon:star-filled" class="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            <span
              class="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
              style="font-family: 'Instrument Serif', ui-serif, serif;"
            >
              {{ formatInt(data.totalStars) }}
            </span>
          </div>
          <span class="text-sm text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
            总 Stars · {{ formatInt(data.totalRepos) }} 个仓库
          </span>
          <span
            v-if="pending"
            class="inline-flex items-center gap-1 text-xs text-muted-foreground"
            style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
          >
            <Icon name="carbon:renew" class="h-3 w-3 motion-safe:animate-spin" aria-hidden="true" /> 更新中…
          </span>
        </div>

        <!-- Breakdown -->
        <div class="grid gap-3 sm:grid-cols-2">
          <!-- Personal -->
          <div class="rounded-xl border border-border bg-background/60 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/50">
            <div class="flex items-center justify-between gap-2">
              <a
                :href="`https://github.com/${encodeURIComponent(data.username)}`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline underline-offset-4"
                style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
              >
                <Icon name="carbon:user" class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                个人
                <span class="font-normal text-muted-foreground">@{{ data.username }}</span>
              </a>
              <span class="text-xs text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">{{ data.personalReposCount }} 仓</span>
            </div>
            <p class="mt-2 flex items-baseline gap-2" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              <span class="text-xl font-semibold tabular-nums text-foreground">{{ formatInt(data.personalStars) }}</span>
              <span class="text-xs text-muted-foreground">stars</span>
            </p>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-amber-500/90 dark:bg-amber-400 motion-safe:transition-[width] motion-safe:duration-500"
                :style="{ width: data.totalStars ? `${Math.round((data.personalStars / data.totalStars) * 100)}%` : '0%' }"
              />
            </div>
          </div>

          <!-- Org summary / empty -->
          <div
            v-if="!data.orgs.length"
            class="rounded-xl border border-dashed border-border bg-muted/20 p-4"
          >
            <p class="text-sm font-medium text-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              暂无公开组织
            </p>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              该账号当前没有公开的组织归属，或组织下暂无公开仓库。个人 Stars 已为全量。
            </p>
          </div>

          <template v-else>
            <div
              v-for="org in data.orgs"
              :key="org.login"
              class="rounded-xl border border-border bg-background/60 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/50"
            >
              <div class="flex items-center justify-between gap-2">
                <a
                  :href="`https://github.com/${encodeURIComponent(org.login)}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline underline-offset-4"
                  style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
                >
                  <Icon name="carbon:group" class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {{ org.login }}
                </a>
                <span class="text-xs text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">{{ org.reposCount }} 仓<span v-if="org.forkReposCount"> · {{ org.forkReposCount }} fork 已排除</span></span>
              </div>
              <p class="mt-2 flex items-baseline gap-2" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
                <span class="text-xl font-semibold tabular-nums text-foreground">{{ formatInt(org.stars) }}</span>
                <span class="text-xs text-muted-foreground">stars</span>
              </p>
              <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-sky-500/90 dark:bg-sky-400 motion-safe:transition-[width] motion-safe:duration-500"
                  :style="{ width: data.totalStars ? `${Math.round((org.stars / data.totalStars) * 100)}%` : '0%' }"
                />
              </div>
            </div>
          </template>
        </div>

        <!-- Footnote -->
        <p class="text-xs text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
          数据每小时缓存一次<span v-if="updatedText"> · 更新于 {{ updatedText }}</span> · 仅统计公开仓库，fork 默认不计入。
          <a :href="`https://github.com/${encodeURIComponent(data.username)}?tab=repositories`" target="_blank" rel="noopener noreferrer" class="underline decoration-border underline-offset-4 hover:text-foreground">在 GitHub 验证</a>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
</style>
