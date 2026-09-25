<script setup lang="ts">
import { formatDate } from '~/lib/utils'

definePageMeta({
  title: 'pages.title.top',
})

useSeoMeta({
  title: 'Bennett - 前端工程化、Vue/Nuxt 实战与开源',
  description: 'Bennett 的个人网站，专注前端工程化与 Vue/Nuxt 实战，分享 SSR 服务端渲染、性能优化与开发者体验心得，记录开源项目与 NPM 工具库的实践经验。',
  ogType: 'website',
  ogTitle: 'Bennett - 前端工程化、Vue/Nuxt 实战与开源',
  ogDescription: 'Bennett 的个人网站，专注前端工程化与 Vue/Nuxt 实战，分享 SSR 服务端渲染、性能优化与开发者体验心得，记录开源项目与 NPM 工具库的实践经验。',
  twitterTitle: 'Bennett - 前端工程化、Vue/Nuxt 实战与开源',
  twitterDescription: 'Bennett 的个人网站，专注前端工程化与 Vue/Nuxt 实战，分享 SSR 服务端渲染、性能优化与开发者体验心得，记录开源项目与 NPM 工具库的实践经验。',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://bennett-website.vercel.app/' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Bennett',
        'url': 'https://bennett-website.vercel.app/',
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': 'Bennett',
        'url': 'https://bennett-website.vercel.app/',
        'jobTitle': '前端工程师',
        'sameAs': [
          'https://github.com/ruanbw',
          'https://www.npmjs.com/~ruanbw',
        ],
      }),
    },
  ],
})

/* ---------- 数据 ---------- */

// 01 作品：最近 3 个实战项目，与 /projects 同源
const { data: projects } = await useAsyncData('home-projects', () =>
  queryCollection('projects')
    .select('title', 'description', 'cover', 'tags', 'path')
    .order('date', 'DESC')
    .limit(3)
    .all())

// 02 写作：最近 3 篇文章
const { data: recentPosts } = await useAsyncData('home-recent-posts', () =>
  queryCollection('blog').select('title', 'path', 'date', 'description').order('date', 'DESC').limit(3).all())

interface GithubProfilePayload {
  login: string
  name: string | null
  bio: string | null
  avatarUrl: string
  profileUrl: string
  location: string | null
  publicRepos: number
  followers: number
  topLanguages: { name: string, percent: number }[]
}

interface GithubStarsPayload {
  totalStars: number
  totalRepos: number
  updatedAt: string
}

interface NpmStatsPayload {
  maintainer: string
  updatedAt: string
  totals: { packageCount: number, lastWeek: number, lastMonth: number, total: number }
}

// 03 开源：三个接口均走客户端懒加载，不阻塞 SSR 首字节与 hydration
const GITHUB = 'ruanbw'
const profileOpts = { server: false, lazy: true } as const

const { data: ghProfile } = await useFetch<GithubProfilePayload>(
  () => `/api/github/${GITHUB}`,
  { ...profileOpts, key: 'home-github-profile' },
)

const { data: ghStars, refresh: refreshStars } = await useFetch<GithubStarsPayload>(
  () => `/api/github/${GITHUB}/stars`,
  { ...profileOpts, key: 'home-github-stars' },
)

const { data: npmStats, refresh: refreshNpm } = await useFetch<NpmStatsPayload>(
  () => '/api/npm/stats',
  { ...profileOpts, key: 'home-npm-stats' },
)

const refreshing = ref(false)
async function refreshAll() {
  refreshing.value = true
  try {
    await Promise.all([refreshStars(), refreshNpm()])
  }
  finally {
    refreshing.value = false
  }
}

/* ---------- 展示辅助 ---------- */

function fmtInt(n: number) {
  return new Intl.NumberFormat(undefined).format(n)
}

function fmtCompact(n: number) {
  return new Intl.NumberFormat(undefined, {
    notation: n >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(n)
}

const topLanguages = computed(() => (ghProfile.value?.topLanguages ?? []).slice(0, 3).map(l => l.name).join(' · '))

const statsUpdated = computed(() => {
  const raw = npmStats.value?.updatedAt || ghStars.value?.updatedAt
  if (!raw)
    return ''
  try {
    return new Date(raw).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  catch { return '' }
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 sm:px-8">
    <!-- ══ Hero：纯排版，无卡片无边框 ══ -->
    <section class="border-b border-border pb-16 pt-14 sm:pb-24 sm:pt-24">
      <div class="rise rise-1 flex items-center gap-2.5">
        <span class="relative flex size-2" aria-hidden="true">
          <span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60 motion-reduce:animate-none" />
          <span class="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Available for work</span>
      </div>

      <div class="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div class="lg:col-span-8">
          <h1
            class="rise rise-2 font-display text-balance text-[clamp(2.6rem,8.5vw,5.25rem)] leading-[1.04] tracking-[-0.02em] sm:leading-[0.92]"
          >
            造好用的产品，<br>
            <span class="italic text-muted-foreground">写清楚的博客。</span>
          </h1>
          <p class="rise rise-3 mt-8 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
            前端工程化、Vue/Nuxt SSR 与性能优化。做过视频点播平台、Telegram Bot
            工具链和知识库系统，也把踩过的坑写成了文章。
          </p>

          <div class="rise rise-4 mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            <NuxtLink
              to="/projects"
              class="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              <span class="border-b border-foreground/30 pb-0.5 transition-colors group-hover:border-foreground">查看作品</span>
              <Icon name="carbon:arrow-right" class="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink to="/blogs" class="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
              <span class="border-b border-foreground/30 pb-0.5 transition-colors group-hover:border-foreground">写点东西</span>
              <Icon name="carbon:arrow-right" class="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </NuxtLink>
            <a
              href="https://github.com/ruanbw"
              target="_blank"
              rel="noopener noreferrer"
              class="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span class="border-b border-muted-foreground/30 pb-0.5 transition-colors group-hover:border-foreground">GitHub</span>
              <Icon name="carbon:arrow-up-right" class="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <!-- 右侧竖排 meta，替代原来的 Explore 卡片 -->
        <dl class="rise rise-4 flex flex-col gap-5 text-sm lg:col-span-4 lg:items-end lg:text-right">
          <div>
            <dt class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Based in
            </dt>
            <dd class="mt-1.5 text-foreground">
              {{ ghProfile?.location || 'China' }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Stack
            </dt>
            <dd class="mt-1.5 text-foreground">
              {{ topLanguages || 'TypeScript · Vue · Nuxt' }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Also on
            </dt>
            <dd class="mt-1.5 flex gap-4 lg:justify-end">
              <a href="https://www.npmjs.com/~ruanbw" target="_blank" rel="noopener noreferrer" class="text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground">npm</a>
              <NuxtLink to="/demos/components" class="text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground">
                demos
              </NuxtLink>
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- ══ 01 作品 ══ -->
    <section aria-labelledby="section-work">
      <div class="pt-16 sm:pt-20">
        <SectionHeading id="section-work" index="01" title="Selected work">
          <NuxtLink to="/projects" class="group inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            全部项目
            <Icon name="carbon:arrow-right" class="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </SectionHeading>
      </div>

      <div v-if="projects?.length" class="grid gap-x-8 gap-y-12 pt-10 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectEntry
          v-for="project in projects"
          :key="project.path"
          :project="project"
        />
      </div>
      <p v-else class="pt-10 text-sm text-muted-foreground">
        暂无项目。
      </p>
    </section>

    <!-- ══ 02 写作 ══ -->
    <section aria-labelledby="section-writing" class="mt-20 sm:mt-28">
      <SectionHeading id="section-writing" index="02" title="Writing">
        <NuxtLink to="/blogs" class="group inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          全部文章
          <Icon name="carbon:arrow-right" class="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>
      </SectionHeading>

      <ul v-if="recentPosts?.length" class="mt-2">
        <li v-for="post in recentPosts" :key="post.path" class="border-b border-border/70 last:border-b-0">
          <NuxtLink
            :to="post.path"
            class="group grid gap-1 py-7 transition-opacity hover:opacity-100 sm:grid-cols-12 sm:items-baseline sm:gap-6 sm:opacity-85"
          >
            <time :datetime="new Date(post.date as any).toISOString()" class="text-xs tabular-nums text-muted-foreground sm:col-span-2">
              {{ formatDate(post.date as any) }}
            </time>
            <div class="sm:col-span-10">
              <h3 class="font-display text-[26px] leading-snug">
                {{ post.title }}
              </h3>
              <p v-if="post.description" class="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                {{ post.description }}
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="pt-10 text-sm text-muted-foreground">
        暂无文章。
      </p>
    </section>

    <!-- ══ 03 开源 ══ -->
    <section aria-labelledby="section-oss" class="mt-20 pb-20 sm:mt-28 sm:pb-28">
      <SectionHeading id="section-oss" index="03" title="Open source" />

      <div class="flex flex-col gap-8 pt-8 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex items-center gap-4">
          <NuxtImg
            v-if="ghProfile?.avatarUrl"
            :src="ghProfile.avatarUrl"
            :alt="`${ghProfile.login} 的 GitHub 头像`"
            width="56"
            height="56"
            sizes="56px"
            densities="1x 2x"
            quality="80"
            format="webp"
            loading="lazy"
            decoding="async"
            class="size-14 rounded-full object-cover"
          />
          <div v-else class="size-14 rounded-full bg-muted" />
          <div class="min-w-0">
            <p class="font-display truncate text-[22px] leading-tight">
              {{ ghProfile?.name || 'Bennett' }}
            </p>
            <a
              :href="ghProfile?.profileUrl || 'https://github.com/ruanbw'"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >@{{ ghProfile?.login || 'ruanbw' }}</a>
          </div>
        </div>

        <!-- 一行式指标，取代原来的两大统计卡片 -->
        <dl class="flex flex-wrap gap-x-10 gap-y-5 sm:justify-end">
          <div class="min-w-24">
            <dt class="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
              <Icon name="carbon:star-filled" class="size-3 text-amber-500" aria-hidden="true" />Stars
            </dt>
            <dd class="mt-1.5 font-display text-2xl tabular-nums">
              {{ ghStars ? fmtInt(ghStars.totalStars) : '—' }}
            </dd>
          </div>
          <div class="min-w-24">
            <dt class="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
              <Icon name="carbon:download" class="size-3" aria-hidden="true" />NPM 下载
            </dt>
            <dd class="mt-1.5 font-display text-2xl tabular-nums">
              {{ npmStats ? fmtCompact(npmStats.totals.total) : '—' }}
            </dd>
          </div>
          <div class="min-w-20">
            <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
              公开包
            </dt>
            <dd class="mt-1.5 font-display text-2xl tabular-nums">
              {{ npmStats ? fmtInt(npmStats.totals.packageCount) : '—' }}
            </dd>
          </div>
          <div class="min-w-20">
            <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
              仓库
            </dt>
            <dd class="mt-1.5 font-display text-2xl tabular-nums">
              {{ ghProfile ? fmtInt(ghProfile.publicRepos) : '—' }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/70 pt-5 text-[11px] text-muted-foreground/80">
        <p>
          仅统计公开仓库，fork 不计入<span v-if="statsUpdated"> · 数据缓存每小时更新</span>
        </p>
        <button
          type="button"
          class="group inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          @click="refreshAll"
        >
          <Icon
            name="carbon:renew"
            class="size-3"
            :class="refreshing ? 'motion-safe:animate-spin' : 'group-hover:rotate-180 motion-reduce:group-hover:rotate-0'"
            aria-hidden="true"
          />
          {{ refreshing ? '更新中' : '刷新数据' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 首屏逐段淡入：只在支持动效的设备上生效 */
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.rise {
  animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.rise-1 { animation-delay: 0.05s; }
.rise-2 { animation-delay: 0.15s; }
.rise-3 { animation-delay: 0.25s; }
.rise-4 { animation-delay: 0.35s; }

@media (prefers-reduced-motion: reduce) {
  .rise {
    animation: none;
  }
}
</style>
