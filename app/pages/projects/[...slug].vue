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

useSeoMeta({
  title: doc.value.title,
  description: doc.value.description,
})

useHead({
  title: () =>
    doc.value?.title ? `${doc.value.title} · ${t('layouts.title')}` : t('layouts.title'),
  link: doc.value?.url
    ? [{ rel: 'canonical', href: doc.value.url }]
    : [],
})
</script>

<template>
  <PageContainer v-if="doc">
    <article>
      <!-- Hero -->
      <header class="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <div class="aspect-[21/9] w-full overflow-hidden bg-muted/30">
          <NuxtImg
            :src="doc.cover"
            :alt="doc.title"
            class="h-full w-full object-cover object-top"
            loading="eager"
            decoding="async"
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
            preload="metadata"
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
  </PageContainer>
</template>
