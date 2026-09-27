<script setup lang="ts">
definePageMeta({
  title: 'pages.title.projects',
})

useSeoMeta({
  title: '项目 | Bennett',
  description: 'Bennett 的开源项目列表，汇总基于 Vue/Nuxt 的实战项目、前端工程化工具与 NPM 包，展示 SSR、性能优化与开发者体验方面的实践成果。',
  ogType: 'website',
  ogTitle: '项目 | Bennett',
  ogDescription: 'Bennett 的开源项目列表，汇总基于 Vue/Nuxt 的实战项目、前端工程化工具与 NPM 包，展示 SSR、性能优化与开发者体验方面的实践成果。',
  twitterTitle: '项目 | Bennett',
  twitterDescription: 'Bennett 的开源项目列表，汇总基于 Vue/Nuxt 的实战项目、前端工程化工具与 NPM 包，展示 SSR、性能优化与开发者体验方面的实践成果。',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://bennett-website.vercel.app/projects' },
  ],
})

const { data: projects } = await useAsyncData('projects-list', () =>
  queryCollection('projects').select('title', 'description', 'url', 'cover', 'tags', 'path', 'date').order('date', 'DESC').all())

type ProjectItem = NonNullable<typeof projects.value>[number]
</script>

<template>
  <PageContainer>
    <!-- 页首：与首页同构，大字 + 右侧计数 meta -->
    <header class="grid gap-8 border-b border-border pb-12 pt-14 sm:pb-16 sm:pt-24 lg:grid-cols-12 lg:items-end">
      <div class="lg:col-span-8">
        <h1
          class="font-display text-balance text-[clamp(2.4rem,7vw,4.5rem)] leading-[0.95] tracking-[-0.02em]"
        >
          Selected <span class="italic text-muted-foreground">work.</span>
        </h1>
        <p class="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
          {{ $t('pages.projects.subtitle') }}
        </p>
      </div>
      <dl class="flex flex-row gap-10 lg:col-span-4 lg:justify-end lg:text-right">
        <div>
          <dt class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            Projects
          </dt>
          <dd
            class="mt-1.5 font-display text-2xl tabular-nums"
          >
            {{ projects?.length || 0 }}
          </dd>
        </div>
      </dl>
    </header>

    <p v-if="!projects?.length" class="pt-16 text-sm text-muted-foreground">
      {{ $t('pages.projects.empty') }}
    </p>

    <div v-else class="grid gap-x-8 gap-y-14 pt-12 sm:grid-cols-2 lg:grid-cols-3">
      <ProjectEntry
        v-for="project in projects as ProjectItem[]"
        :key="project.path"
        :project="project"
      />
    </div>

    <div class="h-20 sm:h-28" />
  </PageContainer>
</template>
