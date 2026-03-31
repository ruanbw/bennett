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

useSeoMeta({
  title: doc.value.title,
  description: doc.value.description,
})

useHead({
  title: () =>
    doc.value?.title ? `${doc.value.title} · ${t('layouts.title')}` : t('layouts.title'),
})
</script>

<template>
  <PageContainer v-if="doc">
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
  </PageContainer>
</template>
