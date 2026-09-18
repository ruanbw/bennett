<script setup lang="ts">
definePageMeta({
  title: 'pages.title.projects',
})

const route = useRoute()
const { t } = useI18n()
const contentPath = route.path

const { data: doc } = await useAsyncData(`project${contentPath}`, () => queryCollection('projects').path(contentPath).first())

if (!doc.value) {
  throw createError({
    statusCode: 404,
    statusMessage: t('pages.projects.notFound'),
  })
}

const SITE_URL = 'https://bennett-website.vercel.app'
// P0 修复：canonical 必须是本站绝对地址；doc.url 是站外演示地址，仅保留为页面“访问项目”外链
const canonicalUrl = `${SITE_URL}${route.path}`
const coverImage = doc.value.cover.startsWith('http') ? doc.value.cover : `${SITE_URL}${doc.value.cover}`
const publishedTime = doc.value.date ? new Date(doc.value.date).toISOString() : undefined

// 相关项目：同集合按时间倒序取 3 个（排除当前）
const { data: relatedProjects } = await useAsyncData(`project-related${contentPath}`, () =>
  queryCollection('projects').select('title', 'description', 'cover', 'path', 'date').order('date', 'DESC').all())
const related = computed(() => (relatedProjects.value ?? []).filter(p => p.path !== contentPath).slice(0, 3))

useSeoMeta({
  title: doc.value.title,
  description: doc.value.description,
  ogType: 'website',
  ogTitle: doc.value.title,
  ogDescription: doc.value.description,
  ogImage: coverImage,
  ogUrl: canonicalUrl,
  author: 'Bennett',
  twitterCard: 'summary_large_image',
  twitterTitle: doc.value.title,
  twitterDescription: doc.value.description,
  twitterImage: coverImage,
})

useHead({
  // 标题只由 useSeoMeta 提供，统一走全局 titleTemplate '%s · Bennett'，避免双后缀
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        'name': doc.value.title,
        'description': doc.value.description,
        'url': doc.value.url,
        'image': coverImage,
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
          { '@type': 'ListItem', 'position': 2, 'name': '项目', 'item': `${SITE_URL}/projects` },
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
      <NuxtLink to="/projects" class="hover:text-foreground hover:underline underline-offset-4">
        项目
      </NuxtLink>
      <span aria-hidden="true">/</span>
      <span class="line-clamp-1 max-w-[40ch] text-foreground" aria-current="page">{{ doc.title }}</span>
    </nav>
    <article>
      <!-- Hero -->
      <header class="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <div class="aspect-[21/9] w-full overflow-hidden bg-muted/30">
          <NuxtImg
            :src="doc.cover"
            :alt="doc.title"
            class="h-full w-full object-cover object-top"
            loading="eager"
            fetchpriority="high"
            preload
            decoding="async"
            format="webp"
            quality="80"
            sizes="100vw"
            density="1x"
          />
        </div>
        <div class="p-6 sm:p-8">
          <h1 class="text-3xl font-semibold tracking-tight text-foreground">
            {{ doc.title }}
          </h1>
          <p class="mt-2 max-w-[60ch] text-muted-foreground">
            {{ doc.description }}
          </p>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <a
              :href="doc.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {{ $t('pages.projects.visit') }}
              <Icon name="carbon:arrow-up-right" class="size-4" aria-hidden="true" />
            </a>
            <div v-if="doc.tags?.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in doc.tags"
                :key="tag"
                class="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- 演示视频 -->
      <section v-if="doc.video" class="mt-8">
        <h2 class="mb-3 text-lg font-semibold tracking-tight text-foreground">
          {{ $t('pages.projects.demoVideo') }}
        </h2>
        <div class="overflow-hidden rounded-2xl border border-border bg-black shadow-sm">
          <video
            :src="doc.video"
            class="block aspect-video w-full"
            controls
            playsinline
            preload="none"
            :poster="doc.cover"
          />
        </div>
      </section>

      <!-- 截图画廊 -->
      <section v-if="doc.images?.length" class="mt-8">
        <h2 class="mb-3 text-lg font-semibold tracking-tight text-foreground">
          {{ $t('pages.projects.screenshots') }}
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <NuxtImg
            v-for="(img, i) in doc.images"
            :key="img"
            :src="img"
            :alt="`${doc.title} screenshot ${i + 1}`"
            class="w-full rounded-2xl border border-border shadow-sm"
            loading="lazy"
            decoding="async"
            format="webp"
            quality="80"
            sizes="100vw sm:50vw"
            density="1x"
          />
        </div>
      </section>

      <!-- 正文 -->
      <section class="mt-8">
        <div class="prose prose-neutral max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground">
          <ContentRenderer :value="doc" />
        </div>
      </section>
    </article>

    <section v-if="related.length" class="mt-12 border-t border-border pt-8">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold tracking-tight text-foreground">
          相关项目
        </h2>
        <NuxtLink to="/projects" class="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
          全部项目
        </NuxtLink>
      </div>
      <ul class="grid gap-4 sm:grid-cols-3">
        <li v-for="project in related" :key="project.path">
          <NuxtLink
            :to="project.path"
            class="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors hover:shadow-md"
          >
            <div class="relative aspect-[16/9] overflow-hidden bg-muted/30">
              <NuxtImg
                :src="project.cover"
                :alt="project.title"
                class="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
                format="webp"
                quality="80"
                sizes="100vw sm:33vw"
                density="1x"
              />
            </div>
            <div class="flex flex-1 flex-col gap-1 p-4">
              <div class="line-clamp-1 text-sm font-semibold text-foreground group-hover:underline underline-offset-4">
                {{ project.title }}
              </div>
              <p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {{ project.description }}
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </PageContainer>
</template>
