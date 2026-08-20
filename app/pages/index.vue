<script setup lang="ts">
definePageMeta({
  title: 'pages.title.top',
})

const { data: recentPosts } = await useAsyncData('home-recent-posts', () =>
  queryCollection('blog').select('title', 'path', 'date', 'description').order('date', 'DESC').limit(3).all())

function fmtDate(v: string | Date) {
  try {
    return new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }
  catch { return String(v) }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-10 pt-2 sm:px-6 sm:pb-12 sm:pt-4">
    <!-- Hero: 已去重，右侧不再放头像/简介，避免与下方 GithubProfileCard 重复 -->
    <section class="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-40"
        style="background:
          radial-gradient(900px 520px at 8% -10%, oklch(0.78 0.09 250 / 0.18), transparent 56%),
          radial-gradient(820px 480px at 96% 0%, oklch(0.72 0.13 35 / 0.14), transparent 58%),
          linear-gradient(to bottom, color-mix(in oklch, var(--border) 28%, transparent), transparent 42%);"
      />
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.06]"
        style="background-image: linear-gradient(color-mix(in oklch, var(--foreground) 16%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground) 16%, transparent) 1px, transparent 1px); background-size: 22px 22px;"
      />
      <div class="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:items-center lg:p-10">
        <div class="lg:col-span-7">
          <div class="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span class="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_color-mix(in_oklch,var(--color-emerald-500)_18%,transparent)]" aria-hidden="true" />
            Product-minded Engineer · Open Source
          </div>
          <h1
            class="mt-4 text-pretty text-[30px] font-semibold leading-[0.95] tracking-tight sm:text-[42px] lg:text-[48px]"
            style="font-family: 'Instrument Serif', ui-serif, serif;"
          >
            Bennett
            <span class="block text-lg font-normal tracking-normal text-muted-foreground sm:text-xl" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              造好用的产品，写清楚的博客。
            </span>
          </h1>
          <p class="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
            关注前端工程化、性能与开发者体验。开源项目累计获得不少 Star，NPM 上也有一些被实际使用的小工具。这里汇总了个人档案、Star 与下载数据，以及最近的写作。
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <NuxtLink
              to="/blogs"
              class="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
            >
              看看博客
              <Icon name="carbon:arrow-right" class="ml-1.5 size-4" aria-hidden="true" />
            </NuxtLink>
            <a
              href="https://github.com/ruanbw"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
            >
              <Icon name="carbon:logo-github" class="mr-1.5 size-4" aria-hidden="true" />
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/~ruanbw"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
            >
              NPM
            </a>
          </div>
          <div class="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
            <span class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1">
              <Icon name="carbon:location" class="size-3.5" aria-hidden="true" /> China
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1">
              <Icon name="carbon:code" class="size-3.5" aria-hidden="true" /> TypeScript / Vue / Nuxt
            </span>
            <NuxtLink to="/demos/components" class="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 hover:bg-muted/50">
              Demos
              <Icon name="carbon:arrow-up-right" class="size-3" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>
        <div class="lg:col-span-5">
          <div class="relative mx-auto max-w-sm lg:ml-auto">
            <div class="absolute -inset-3 -z-10 rounded-[28px] bg-gradient-to-br from-violet-500/10 via-sky-500/10 to-amber-500/10 blur-2xl" aria-hidden="true" />
            <div class="rounded-[22px] border border-border bg-background/70 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:p-5">
              <div class="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
                Explore
              </div>
              <p class="mt-2 text-sm leading-relaxed text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
                往下是档案、Star 与 NPM 数据，支持刷新与缓存。先挑一个入口进去也行。
              </p>
              <div class="mt-4 grid gap-2">
                <NuxtLink to="/blogs" class="group flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 transition-colors hover:bg-background">
                  <span class="flex items-center gap-2 text-sm font-medium"><Icon name="carbon:book" class="size-4 text-muted-foreground" aria-hidden="true" /> 博客</span>
                  <Icon name="carbon:arrow-right" class="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </NuxtLink>
                <a href="https://github.com/ruanbw" target="_blank" rel="noopener noreferrer" class="group flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 transition-colors hover:bg-background">
                  <span class="flex items-center gap-2 text-sm font-medium"><Icon name="carbon:logo-github" class="size-4 text-muted-foreground" aria-hidden="true" /> GitHub</span>
                  <Icon name="carbon:arrow-up-right" class="size-4 text-muted-foreground" aria-hidden="true" />
                </a>
                <a href="https://www.npmjs.com/~ruanbw" target="_blank" rel="noopener noreferrer" class="group flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 transition-colors hover:bg-background">
                  <span class="flex items-center gap-2 text-sm font-medium"><Icon name="carbon:package" class="size-4 text-muted-foreground" aria-hidden="true" /> NPM</span>
                  <Icon name="carbon:arrow-up-right" class="size-4 text-muted-foreground" aria-hidden="true" />
                </a>
              </div>
              <div class="mt-4 flex flex-wrap gap-1.5">
                <span class="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">每小时缓存</span>
                <span class="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">可刷新</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="mt-6 grid gap-6 lg:grid-cols-12">
      <div class="lg:col-span-5">
        <GithubProfileCard username="ruanbw" />
      </div>
      <div class="lg:col-span-7">
        <GithubTotalStars username="ruanbw" />
      </div>
      <div class="lg:col-span-12">
        <NpmDownloadsSection />
      </div>
      <section class="lg:col-span-12 rounded-2xl border border-border bg-card shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 p-6 sm:p-8 pb-4">
          <div>
            <h2 class="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              最近写作
            </h2>
            <p class="mt-1 text-sm text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              挑了最新的 3 篇，先看一篇也好。
            </p>
          </div>
          <NuxtLink
            to="/blogs"
            class="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-background px-3 text-xs font-medium hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style="font-family: 'DM Sans', ui-sans-serif, system-ui;"
          >
            全部博客
            <Icon name="carbon:arrow-right" class="size-3.5" aria-hidden="true" />
          </NuxtLink>
        </div>
        <div v-if="recentPosts?.length" class="grid gap-3 px-6 pb-6 sm:px-8 sm:pb-8 sm:grid-cols-3">
          <NuxtLink
            v-for="post in recentPosts"
            :key="post.path"
            :to="post.path"
            class="group flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-4 backdrop-blur transition-colors hover:bg-background hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div class="text-xs text-muted-foreground" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">
              {{ fmtDate(post.date as any) }}
            </div>
            <div class="line-clamp-2 text-sm font-semibold leading-snug group-hover:underline underline-offset-4">
              {{ post.title }}
            </div>
            <div v-if="post.description" class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {{ post.description }}
            </div>
            <span class="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-muted-foreground group-hover:text-foreground">
              阅读
              <Icon name="carbon:arrow-up-right" class="size-3" aria-hidden="true" />
            </span>
          </NuxtLink>
        </div>
        <div v-else class="px-6 pb-6 sm:px-8 sm:pb-8">
          <p class="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            暂无文章。
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
</style>
