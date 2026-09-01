<script setup lang="ts">
definePageMeta({
  title: 'pages.title.projects',
})

const { data: projects } = await useAsyncData('projects-list', () =>
  queryCollection('projects').select('title', 'description', 'url', 'cover', 'tags', 'path', 'date').order('date', 'DESC').all())

type ProjectItem = NonNullable<typeof projects.value>[number]
</script>

<template>
  <PageContainer>
    <header class="mb-10">
      <h1 class="text-3xl font-semibold tracking-tight text-foreground">
        {{ $t('pages.title.projects') }}
      </h1>
      <p class="mt-2 text-muted-foreground">
        {{ $t('pages.projects.subtitle') }}
      </p>
    </header>

    <div v-if="!projects?.length" class="text-muted-foreground">
      {{ $t('pages.projects.empty') }}
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="project in projects as ProjectItem[]"
        :key="project.path"
        :to="project.path"
        class="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div class="relative aspect-[16/9] overflow-hidden bg-muted/30">
          <NuxtImg
            :src="project.cover"
            :alt="project.title"
            class="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            density="1x"
          />
        </div>
        <div class="flex flex-1 flex-col gap-2 p-5">
          <h2 class="text-base font-semibold text-foreground group-hover:underline underline-offset-4">
            {{ project.title }}
          </h2>
          <p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {{ project.description }}
          </p>
          <div v-if="project.tags?.length" class="mt-auto flex flex-wrap gap-1.5 pt-3">
            <span
              v-for="tag in project.tags"
              :key="tag"
              class="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </PageContainer>
</template>
