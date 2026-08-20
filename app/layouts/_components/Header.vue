<script setup lang="ts">
import { Book } from 'lucide-vue-next'

// const isDark = useDark()

</script>

<template>
  <header class="flex justify-between min-h-16 items-center px-4">
    <!-- 网站标题、头像 -->
    <NuxtLink to="/" class="transition-colors" aria-label="首页">
      <img
        src="/avatar.jpg"
        alt="Bennett"
        width="36"
        height="36"
        class="h-9 w-9 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
        loading="eager"
        decoding="async"
      />
    </NuxtLink>

    <!-- 导航栏 -->
    <!-- <nav class="mx-auto">
      <NuxtLink v-for="nav in navs" :key="nav.href" :to="nav.href"
        class="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
        active-class="text-foreground">
        {{ nav.name }}
      </NuxtLink>
    </nav> -->

    <!-- 其他功能按钮 -->
    <div class="flex items-center gap-2">
      <nav class="flex items-center gap-2">
        <NuxtLink
          to="/blogs"
          class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          aria-label="博客"
        >
          <Book class="size-4" />
        </NuxtLink>
      </nav>

      <ThemeToggle />
    </div>
  </header>
</template>
