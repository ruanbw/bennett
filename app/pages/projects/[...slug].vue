<script setup lang="ts">
import { formatDate } from '~/lib/utils'

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
  queryCollection('projects').select('title', 'description', 'path', 'date').order('date', 'DESC').all())
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
    <nav
      aria-label="面包屑"
      class="flex items-center gap-1.5 pt-10 text-xs text-muted-foreground sm:pt-14"
    >
      <NuxtLink to="/" class="transition-colors hover:text-foreground">
        首页
      </NuxtLink>
      <span aria-hidden="true" class="text-muted-foreground/40">/</span>
      <NuxtLink to="/projects" class="transition-colors hover:text-foreground">
        项目
      </NuxtLink>
    </nav>

    <article class="mt-8 sm:mt-10">
      <!-- 封面：无边框无圆角，铺满内容栏 -->
      <div class="aspect-[21/9] w-full overflow-hidden bg-muted/30">
        <NuxtImg
          :src="doc.cover"
          :alt="doc.title"
          width="1600"
          height="686"
          class="h-full w-full object-cover object-top"
          loading="eager"
          fetchpriority="high"
          preload
          decoding="async"
          format="webp"
          quality="80"
          sizes="100vw"
        />
      </div>

      <!-- 标题区 -->
      <header class="mt-10 grid gap-8 border-b border-border pb-10 lg:grid-cols-12 lg:items-end">
        <div class="lg:col-span-8">
          <h1
            class="font-display text-balance text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.02] tracking-[-0.02em]"
          >
            {{ doc.title }}
          </h1>
          <p class="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
            {{ doc.description }}
          </p>
        </div>
        <div class="flex flex-col gap-6 lg:col-span-4 lg:items-end lg:text-right">
          <a
            :href="doc.url"
            target="_blank"
            rel="noopener noreferrer"
            class="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
          >
            <span class="border-b border-foreground/30 pb-0.5 transition-colors group-hover:border-foreground">
              {{ $t('pages.projects.visit') }}
            </span>
            <Icon
              name="carbon:arrow-up-right"
              class="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
          <p
            v-if="doc.tags?.length"
            class="max-w-[36ch] font-mono text-[11px] uppercase leading-relaxed tracking-wider text-muted-foreground/70"
          >
            {{ doc.tags.join(' / ') }}
          </p>
        </div>
      </header>

      <!-- 演示视频 -->
      <section v-if="doc.video" class="mt-16">
        <SectionHeading index="01" :title="$t('pages.projects.demoVideo')" />
        <div class="mt-8 overflow-hidden bg-black">
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
      <section v-if="doc.images?.length" class="mt-16">
        <SectionHeading index="02" :title="$t('pages.projects.screenshots')" />
        <div class="mt-8 grid gap-6 sm:grid-cols-2">
          <NuxtImg
            v-for="(img, i) in doc.images"
            :key="img"
            :src="img"
            :alt="`${doc.title} screenshot ${i + 1}`"
            width="900"
            height="600"
            class="w-full bg-muted/30"
            loading="lazy"
            decoding="async"
            format="webp"
            quality="80"
            sizes="100vw sm:50vw"
          />
        </div>
      </section>

      <!-- 正文 -->
      <section class="mt-16">
        <SectionHeading index="03" title="Overview" label="项目说明" />
        <div
          class="prose prose-neutral mt-8 max-w-[68ch] dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground"
        >
          <ContentRenderer :value="doc" />
        </div>
      </section>
    </article>

    <section v-if="related.length" class="mt-20 sm:mt-24">
      <SectionHeading index="—" title="Related" label="相关项目">
        <NuxtLink
          to="/projects"
          class="group inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          全部项目
          <Icon
            name="carbon:arrow-right"
            class="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </NuxtLink>
      </SectionHeading>
      <ul class="mt-2">
        <li
          v-for="project in related"
          :key="project.path"
          class="border-b border-border/70 last:border-b-0"
        >
          <NuxtLink
            :to="project.path"
            class="group grid gap-1 py-6 transition-opacity hover:opacity-100 sm:grid-cols-12 sm:items-baseline sm:gap-6 sm:opacity-85"
          >
            <time
              :datetime="new Date(project.date as string | Date).toISOString()"
              class="text-xs tabular-nums text-muted-foreground sm:col-span-2"
            >
              {{ formatDate(project.date as string | Date) }}
            </time>
            <div class="sm:col-span-10">
              <h3 class="font-display text-xl leading-snug">
                {{ project.title }}
              </h3>
              <p class="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                {{ project.description }}
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <div class="h-20 sm:h-28" />
  </PageContainer>
</template>
