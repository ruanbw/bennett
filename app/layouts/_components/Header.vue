<script setup lang="ts">
import { Book } from 'lucide-vue-next'

// const isDark = useDark()

</script>

<template>
  <header class="flex justify-between min-h-16 items-center px-4">
    <!-- 网站标题、LOGO -->
    <NuxtLink to="/" class="transition-colors">
      <!-- <img v-if="!isDark" src="/logo.png" alt="Logo" class="w-10 h-10" /> -->
      <!-- <img v-else src="/logo_dark.jpeg" alt="Logo" class="w-10 h-10" /> -->
      <Logo />
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
