<script setup lang="ts">
import { formatDate } from '~/lib/utils'

definePageMeta({
  title: 'pages.title.blog',
})

useSeoMeta({
  title: '博客 | Bennett',
  description: 'Bennett 的博客列表，分享前端工程化、Vue/Nuxt 实战、SSR 与性能优化心得，记录开源项目与开发体验的思考。',
  ogType: 'website',
  ogTitle: '博客 | Bennett',
  ogDescription: 'Bennett 的博客列表，分享前端工程化、Vue/Nuxt 实战、SSR 与性能优化心得，记录开源项目与开发体验的思考。',
  twitterTitle: '博客 | Bennett',
  twitterDescription: 'Bennett 的博客列表，分享前端工程化、Vue/Nuxt 实战、SSR 与性能优化心得，记录开源项目与开发体验的思考。',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://bennett-website.vercel.app/blogs' },
  ],
})

const { data: posts } = await useAsyncData('blog-list', () => queryCollection('blog').select('title', 'path', 'date', 'description').order('date', 'DESC').all())

type BlogListItem = NonNullable<typeof posts.value>[number]

const postsByYear = computed(() => {
  const list = posts.value ?? []
  const map = new Map<number, BlogListItem[]>()
  for (const post of list) {
    const y = new Date(post.date as string | Date).getUTCFullYear()
    const arr = map.get(y)
    if (arr)
      arr.push(post)
    else
      map.set(y, [post])
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0])
})
</script>

<template>
  <PageContainer>
    <!-- 页首：与首页同构 -->
    <header class="grid gap-8 border-b border-border pb-12 pt-14 sm:pb-16 sm:pt-24 lg:grid-cols-12 lg:items-end">
      <div class="lg:col-span-8">
        <h1
          class="font-display text-balance text-[clamp(2.4rem,7vw,4.5rem)] leading-[0.95] tracking-[-0.02em]"
        >
          Writing <span class="italic text-muted-foreground">notes.</span>
        </h1>
        <p class="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
          前端工程化、Vue/Nuxt SSR、性能优化与开发者体验的实践记录。
        </p>
      </div>
      <dl class="flex flex-row gap-10 lg:col-span-4 lg:justify-end lg:text-right">
        <div>
          <dt class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            Entries
          </dt>
          <dd
            class="mt-1.5 font-display text-2xl tabular-nums"
          >
            {{ posts?.length || 0 }}
          </dd>
        </div>
      </dl>
    </header>

    <p v-if="!posts?.length" class="pt-16 text-sm text-muted-foreground">
      {{ $t('pages.blog.empty') }}
    </p>

    <div v-else class="pt-4">
      <section
        v-for="([year, items], i) in postsByYear"
        :key="year"
        :class="i ? 'mt-16 sm:mt-20' : 'mt-12'"
      >
        <SectionHeading :index="String(i + 1).padStart(2, '0')" :title="String(year)" :label="`${year} 年`" />

        <ul class="mt-2">
          <li
            v-for="post in items"
            :key="post.path"
            class="border-b border-border/70 last:border-b-0"
          >
            <NuxtLink
              :to="post.path"
              class="group grid gap-1 py-7 transition-opacity hover:opacity-100 sm:grid-cols-12 sm:items-baseline sm:gap-6 sm:opacity-85"
            >
              <time
                :datetime="new Date(post.date as string | Date).toISOString()"
                class="text-xs tabular-nums text-muted-foreground sm:col-span-2"
              >
                {{ formatDate(post.date as string | Date) }}
              </time>
              <div class="sm:col-span-10">
                <h3
                  class="font-display text-[26px] leading-snug"
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
    </div>

    <div class="h-20 sm:h-28" />
  </PageContainer>
</template>
