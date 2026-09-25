<script setup lang="ts">
import { formatDate } from '~/lib/utils'

definePageMeta({
  title: 'pages.title.blog',
})

const route = useRoute()
const { t } = useI18n()
const contentPath = route.path

const { data: doc } = await useAsyncData(`blog${contentPath}`, () => queryCollection('blog').path(contentPath).first())

if (!doc.value) {
  throw createError({
    statusCode: 404,
    statusMessage: t('pages.blog.notFound'),
  })
}

const SITE_URL = 'https://bennett-website.vercel.app'
const canonicalUrl = `${SITE_URL}${route.path}`
// blog 集合目前无封面字段：有则用绝对地址，否则回退站内默认头像
const docCover = (doc.value as { cover?: unknown }).cover
const ogImage = typeof docCover === 'string' && docCover.length > 0
  ? (docCover.startsWith('http') ? docCover : `${SITE_URL}${docCover}`)
  : `${SITE_URL}/avatar.jpg`
const publishedTime = doc.value.date ? new Date(doc.value.date).toISOString() : undefined

// 相关阅读：同集合按时间倒序取 3 篇（排除当前）
const { data: relatedPosts } = await useAsyncData(`blog-related${contentPath}`, () =>
  queryCollection('blog').select('title', 'path', 'date', 'description').order('date', 'DESC').all())
const related = computed(() => (relatedPosts.value ?? []).filter(p => p.path !== contentPath).slice(0, 3))

// 右侧目录：由 MDC 解析正文时生成的标题树，无需自己遍历 AST
const tocLinks = computed(() => doc.value?.body?.toc?.links ?? [])

useSeoMeta({
  title: doc.value.title,
  description: doc.value.description,
  ogType: 'article',
  ogTitle: doc.value.title,
  ogDescription: doc.value.description,
  ogImage,
  ogUrl: canonicalUrl,
  articlePublishedTime: publishedTime,
  author: 'Bennett',
  twitterCard: 'summary_large_image',
  twitterTitle: doc.value.title,
  twitterDescription: doc.value.description,
  twitterImage: ogImage,
})

useHead({
  // 标题只由 useSeoMeta 提供，统一走全局 titleTemplate '%s · Bennett'，避免双后缀
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': doc.value.title,
        'description': doc.value.description,
        'datePublished': publishedTime,
        'author': { '@type': 'Person', 'name': 'Bennett' },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': '首页', 'item': `${SITE_URL}/` },
          { '@type': 'ListItem', 'position': 2, 'name': '博客', 'item': `${SITE_URL}/blogs` },
          { '@type': 'ListItem', 'position': 3, 'name': doc.value.title, 'item': canonicalUrl },
        ],
      }),
    },
  ],
})
</script>

<template>
  <PageContainer v-if="doc">
    <nav
      aria-label="面包屑"
      class="flex items-center gap-1.5 pt-10 text-xs text-muted-foreground sm:pt-14"
    >
      <NuxtLink to="/" class="transition-colors hover:text-foreground">
        首页
      </NuxtLink>
      <span aria-hidden="true" class="text-muted-foreground/40">/</span>
      <NuxtLink to="/blogs" class="transition-colors hover:text-foreground">
        博客
      </NuxtLink>
    </nav>

    <article class="mt-8 sm:mt-10">
      <!-- 标题区：大字排版 + 底部细线，与列表页/首页同一套 -->
      <header class="grid gap-8 border-b border-border pb-10 lg:grid-cols-12 lg:items-end">
        <div class="lg:col-span-8">
          <h1
            class="font-display text-balance text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.02] tracking-[-0.02em]"
          >
            {{ doc.title }}
          </h1>
          <p
            v-if="doc.description"
            class="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground"
          >
            {{ doc.description }}
          </p>
        </div>
        <div class="lg:col-span-4 lg:text-right">
          <time
            v-if="doc.date"
            :datetime="new Date(doc.date as string | Date).toISOString()"
            class="text-xs tabular-nums text-muted-foreground"
          >
            {{ formatDate(doc.date as string | Date) }}
          </time>
          <p class="mt-1.5 text-xs text-muted-foreground/70">
            Bennett
          </p>
        </div>
      </header>

      <!-- 移动端：目录折叠在正文上方（桌面端由右侧 sticky 栏承担） -->
      <details
        v-if="tocLinks.length"
        class="mt-10 rounded-xl border border-border p-4 lg:hidden"
      >
        <summary class="cursor-pointer text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          目录
        </summary>
        <div class="mt-4">
          <TableOfContents :links="tocLinks" />
        </div>
      </details>

      <!-- 正文 + 右侧目录 -->
      <div class="mt-10 grid gap-x-16 lg:grid-cols-12">
        <!-- min-w-0：grid 子项默认 min-width:auto，会被正文里长代码行的
             min-content 宽度撑开，导致移动端整页横向溢出 -->
        <div
          class="prose prose-neutral min-w-0 max-w-[68ch] dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground lg:col-span-8"
        >
          <ContentRenderer :value="doc" />
        </div>

        <!-- 桌面端右侧 sticky 目录 -->
        <aside v-if="tocLinks.length" class="hidden min-w-0 lg:col-span-4 lg:block">
          <div class="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
            <TableOfContents :links="tocLinks" />
          </div>
        </aside>
      </div>
    </article>

    <section v-if="related.length" class="mt-20 sm:mt-24">
      <SectionHeading index="—" :title="$t('pages.title.blog')" label="相关阅读" />
      <ul class="mt-2">
        <li
          v-for="post in related"
          :key="post.path"
          class="border-b border-border/70 last:border-b-0"
        >
          <NuxtLink
            :to="post.path"
            class="group grid gap-1 py-6 transition-opacity hover:opacity-100 sm:grid-cols-12 sm:items-baseline sm:gap-6 sm:opacity-85"
          >
            <time
              :datetime="new Date(post.date as string | Date).toISOString()"
              class="text-xs tabular-nums text-muted-foreground sm:col-span-2"
            >
              {{ formatDate(post.date as string | Date) }}
            </time>
            <div class="sm:col-span-10">
              <h3
                class="font-display text-xl leading-snug"
              >
                {{ post.title }}
              </h3>
              <p
                v-if="post.description"
                class="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted-foreground"
              >
                {{ post.description }}
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <div class="h-20 sm:h-28" />
  </PageContainer>
</template>
