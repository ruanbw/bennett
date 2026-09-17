<script setup lang="ts">
import Footer from './layouts/_components/Footer.vue'
import Header from './layouts/_components/Header.vue'

const props = defineProps<{
  error?: { statusCode?: number, statusMessage?: string, message?: string }
}>()

const statusCode = computed(() => props.error?.statusCode ?? 404)
const is404 = computed(() => statusCode.value === 404)

// 注意：不包 <NuxtLayout>（default 布局内部的 <Title> 会覆盖这里的标题），直接复用 Header/Footer
useSeoMeta({
  title: is404.value ? '页面未找到' : '出错了',
  description: is404.value ? '你要找的页面不存在或已被移动，试试回到首页、博客或项目列表。' : '页面加载时出了点问题，试试回到首页。',
  robots: 'noindex, follow',
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <section class="relative z-0 flex min-h-screen flex-col bg-background">
    <Header />
    <main class="relative z-10 flex-1">
      <PageContainer>
        <div class="mx-auto max-w-xl py-16 text-center sm:py-24">
          <p class="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {{ statusCode }}
          </p>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {{ is404 ? '这个页面走丢了' : '这里出了点问题' }}
          </h1>
          <p class="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
            {{ is404 ? '链接可能过期或地址输错了，别担心，从下面挑一个地方继续逛。' : (props.error?.message || '稍后再试一次，或者先回首页看看。') }}
          </p>
          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              class="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              @click="goHome"
            >
              回到首页
            </button>
            <NuxtLink
              to="/blogs"
              class="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted/60"
            >
              看看博客
            </NuxtLink>
            <NuxtLink
              to="/projects"
              class="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted/60"
            >
              看看项目
            </NuxtLink>
          </div>
        </div>
      </PageContainer>
    </main>
    <Footer />
  </section>
</template>
