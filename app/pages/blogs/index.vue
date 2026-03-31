<script setup lang="ts">
definePageMeta({
  title: 'pages.title.blog',
})

const { data: posts } = await useAsyncData('blog-list', () => queryCollection('blog').select('title', 'path', 'date').order('date', 'DESC').all())

type BlogListItem = NonNullable<typeof posts.value>[number]

const postsByYear = computed(() => {
  const list = posts.value ?? []
  const map = new Map<number, BlogListItem[]>()
  for (const post of list) {
    const y = new Date(post.date as string | Date).getFullYear()
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
    <header class="mb-10">
      <h1 class="text-3xl font-semibold tracking-tight text-foreground">
        {{ $t('pages.title.blog') }}
      </h1>
    </header>

    <div v-if="!posts?.length" class="text-muted-foreground">
      {{ $t('pages.blog.empty') }}
    </div>

    <div v-else class="space-y-12">
      <section v-for="[year, items] in postsByYear" :key="year">
        <h2 class="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {{ year }}
        </h2>
        <ul class="space-y-2">
          <li v-for="post in items" :key="post.path">
            <NuxtLink
              :to="post.path"
              class="text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              {{ post.title }}
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </PageContainer>
</template>
