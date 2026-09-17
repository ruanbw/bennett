<script setup lang="ts">
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
    <nav aria-label="面包屑" class="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
      <NuxtLink to="/" class="hover:text-foreground hover:underline underline-offset-4">
        首页
      </NuxtLink>
      <span aria-hidden="true">/</span>
      <NuxtLink to="/blogs" class="hover:text-foreground hover:underline underline-offset-4">
        博客
      </NuxtLink>
      <span aria-hidden="true">/</span>
      <span class="line-clamp-1 max-w-[40ch] text-foreground" aria-current="page">{{ doc.title }}</span>
    </nav>
    <article>
      <header class="mb-8 border-b border-border pb-8">
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">
          {{ doc.title }}
        </h1>
        <time
          v-if="doc.date"
          class="mt-2 block text-sm text-muted-foreground"
          :datetime="new Date(doc.date as string | Date).toISOString()"
        >
          {{ new Date(doc.date as string | Date).toLocaleDateString() }}
        </time>
      </header>

      <div class="prose prose-neutral max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground">
        <ContentRenderer :value="doc" />
      </div>
    </article>

    <section v-if="related.length" class="mt-12 border-t border-border pt-8">
      <h2 class="text-lg font-semibold tracking-tight text-foreground">
        相关阅读
      </h2>
      <ul class="mt-4 grid gap-3 sm:grid-cols-3">
        <li v-for="post in related" :key="post.path">
          <NuxtLink
            :to="post.path"
            class="group flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-background hover:shadow-sm"
          >
            <div class="line-clamp-2 text-sm font-semibold leading-snug group-hover:underline underline-offset-4">
              {{ post.title }}
            </div>
            <div v-if="post.description" class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {{ post.description }}
            </div>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </PageContainer>
</template>
