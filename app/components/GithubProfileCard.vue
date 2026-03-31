<script setup lang="ts">
/**
 * 从本项目的 Nitro 路由拉取 GitHub 用户公开信息并渲染为个人名片。
 */
export interface GithubLanguageStat {
  name: string
  percent: number
}

export interface GithubProfilePayload {
  login: string
  name: string | null
  bio: string | null
  avatarUrl: string
  profileUrl: string
  blog: string | null
  location: string | null
  company: string | null
  twitterUsername: string | null
  publicRepos: number
  followers: number
  following: number
  createdAt: string
  /** 由公开仓库主语言聚合，详见服务端实现说明 */
  topLanguages: GithubLanguageStat[]
}

const props = withDefaults(
  defineProps<{
    /** GitHub 用户名（不含 @） */
    username: string
    /** 为 true 时不在挂载时自动请求（便于父级手动刷新） */
    lazy?: boolean
  }>(),
  { lazy: false },
)

const sanitized = computed(() => props.username.trim())

const { data, pending, error, refresh } = await useFetch<GithubProfilePayload>(
  () => `/api/github/${encodeURIComponent(sanitized.value)}`,
  {
    key: () => `github-profile:${sanitized.value.toLowerCase()}`,
    lazy: props.lazy,
    watch: [sanitized],
  },
)

function normalizeHref(raw: string | null | undefined) {
  if (!raw)
    return null
  const t = raw.trim()
  if (!t)
    return null
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

const displayName = computed(() => data.value?.name?.trim() || data.value?.login || '—')
const blogHref = computed(() => normalizeHref(data.value?.blog ?? null))

function formatCount(n: number) {
  return new Intl.NumberFormat(undefined, { notation: n >= 10000 ? 'compact' : 'standard' }).format(n)
}

/** 为每种语言生成稳定色相，避免引入外部颜色表 */
function languageHue(name: string) {
  let h = 2166136261
  for (let i = 0; i < name.length; i++)
    h = Math.imul(h ^ name.charCodeAt(i), 16777619)
  return Math.abs(h) % 360
}
</script>

<template>
  <article
    class="github-profile-card @container relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
    :aria-busy="pending"
  >
    <!-- 装饰：微弱网格与色带，避免「默认卡片」观感 -->
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-40"
      style="background:
        radial-gradient(1200px 500px at 12% -10%, oklch(0.78 0.09 250 / 0.22), transparent 55%),
        radial-gradient(900px 420px at 108% 12%, oklch(0.74 0.12 35 / 0.14), transparent 52%),
        linear-gradient(to bottom, color-mix(in oklch, var(--border) 35%, transparent), transparent 38%);"
    />
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.14] dark:opacity-[0.10]"
      style="background-image: linear-gradient(color-mix(in oklch, var(--foreground) 22%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground) 22%, transparent) 1px, transparent 1px); background-size: 22px 22px;"
    />

    <div class="relative p-6 sm:p-8">
      <div
        v-if="pending && !data"
        class="flex flex-col gap-6"
        aria-hidden="true"
      >
        <div class="flex items-center gap-4 sm:gap-5">
          <div class="h-20 w-20 shrink-0 rounded-full bg-muted motion-safe:animate-pulse sm:h-24 sm:w-24" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-8 max-w-[12rem] rounded bg-muted motion-safe:animate-pulse" />
            <div class="h-4 max-w-[8rem] rounded bg-muted motion-safe:animate-pulse" />
          </div>
        </div>
        <div class="space-y-2">
          <div class="h-3 w-16 rounded bg-muted motion-safe:animate-pulse" />
          <div class="h-4 w-full max-w-md rounded bg-muted motion-safe:animate-pulse" />
          <div class="h-4 w-full max-w-sm rounded bg-muted motion-safe:animate-pulse" />
        </div>
        <div class="space-y-2">
          <div class="h-3 w-20 rounded bg-muted motion-safe:animate-pulse" />
          <div class="h-2 w-full rounded bg-muted motion-safe:animate-pulse" />
          <div class="h-2 max-w-[80%] rounded bg-muted motion-safe:animate-pulse" />
        </div>
        <div class="h-10 w-36 rounded-full bg-muted motion-safe:animate-pulse" />
      </div>

      <div
        v-else-if="error"
        class="space-y-3"
        role="alert"
      >
        <p class="text-lg font-semibold" style="font-family: 'Instrument Serif', ui-serif, serif;">
          暂时读不到这份档案
        </p>
        <p class="max-w-prose text-sm text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
          {{ error?.statusMessage || error?.message || '请稍后再试。' }}
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
          @click="refresh()"
        >
          重试
        </button>
      </div>

      <div
        v-else-if="data"
        class="flex flex-col gap-6"
      >
        <!-- 1. 头像（左） + 昵称（右） -->
        <div class="flex items-center gap-4 sm:gap-5">
          <div class="shrink-0">
            <NuxtImg
              :src="data.avatarUrl"
              :alt="`${data.login} 的 GitHub 头像`"
              width="96"
              height="96"
              class="h-20 w-20 rounded-full ring-1 ring-black/5 sm:h-24 sm:w-24 dark:ring-white/10"
              loading="lazy"
              format="webp"
            />
          </div>
          <div class="min-w-0 flex-1">
            <h2
              class="text-pretty text-2xl leading-tight sm:text-3xl"
              style="font-family: 'Instrument Serif', ui-serif, serif;"
            >
              {{ displayName }}
            </h2>
            <a
              :href="data.profileUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 inline-block text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
              style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
            >
              @{{ data.login }}
            </a>
          </div>
        </div>

        <!-- 2. 个人简介 -->
        <section
          class="min-w-0"
          aria-label="个人简介"
        >
          <h3
            class="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
            style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
          >
            个人简介
          </h3>
          <p
            v-if="data.bio"
            class="mt-2 max-w-prose text-[15px] leading-relaxed text-foreground/90"
            style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
          >
            {{ data.bio }}
          </p>
          <p
            v-else
            class="mt-2 text-sm text-muted-foreground"
            style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
          >
            尚未填写 GitHub 简介。
          </p>
        </section>

        <!-- 3. 常用语言 -->
        <section
          v-if="data.topLanguages.length"
          aria-label="常用开发语言"
        >
          <ul class="mt-3 max-w-prose space-y-2.5">
            <li
              v-for="lang in data.topLanguages"
              :key="lang.name"
            >
              <div
                class="flex items-baseline justify-between gap-3 text-sm"
                style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
              >
                <span class="font-medium text-foreground">{{ lang.name }}</span>
                <span class="shrink-0 tabular-nums text-muted-foreground">{{ lang.percent }}%</span>
              </div>
              <div
                class="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
                role="presentation"
              >
                <div
                  class="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
                  :style="{
                    width: `${lang.percent}%`,
                    background: `oklch(0.58 0.14 ${languageHue(lang.name)})`,
                  }"
                />
              </div>
            </li>
          </ul>
        </section>

        <!-- 4. 前往 GitHub -->
        <div
          class="flex flex-wrap items-center gap-2"
          style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
        >
          <a
            :href="data.profileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            前往 GitHub
          </a>
        </div>

        <!-- 补充：统计与外链（主流程之下） -->
        <div
          class="border-t border-border pt-5 text-sm text-muted-foreground"
          style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
        >
          <ul
            class="flex flex-wrap gap-x-8 gap-y-2 tabular-nums"
            aria-label="公开统计"
          >
            <li>
              <span class="font-semibold text-foreground">{{ formatCount(data.publicRepos) }}</span>
              公开仓库
            </li>
            <li>
              <span class="font-semibold text-foreground">{{ formatCount(data.followers) }}</span>
              关注者
            </li>
            <li>
              <span class="font-semibold text-foreground">{{ formatCount(data.following) }}</span>
              关注中
            </li>
          </ul>
          <div
            v-if="blogHref || data.twitterUsername"
            class="mt-3 flex flex-wrap gap-x-4 gap-y-1"
          >
            <a
              v-if="blogHref"
              :href="blogHref"
              target="_blank"
              rel="noopener noreferrer"
              class="text-foreground underline decoration-border underline-offset-2 transition-colors hover:text-foreground/80"
            >
              个人站点
            </a>
            <a
              v-if="data.twitterUsername"
              :href="`https://x.com/${encodeURIComponent(data.twitterUsername)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-foreground underline decoration-border underline-offset-2 transition-colors hover:text-foreground/80"
            >
              X / Twitter
            </a>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
</style>
