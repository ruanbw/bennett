<script lang="ts" setup>
import AntfuCanvasBackground from '@/components/background/AntfuCanvasBackground.vue'
import Footer from './_components/Footer.vue'
import Header from './_components/Header.vue'
// SEO head generation based on nuxt-i18n.
// https://i18n.nuxtjs.org/docs/guide/seo
const route = useRoute()
const { t } = useI18n()
const head = useLocaleHead()
const title = computed(() => {
  const key = route.meta.title
  if (typeof key === 'string' && key.length > 0)
    return t(key)
  return t('layouts.title')
})
</script>

<template>
  <Html :lang="head.htmlAttrs.lang" :dir="head.htmlAttrs.dir">
    <Head>
      <Title>{{ title }}</Title>
      <template v-for="link in head.link" :key="link.id ?? link.key">
        <Link
          :id="link.id ?? link.key"
          :rel="link.rel"
          :href="link.href"
          :hreflang="link.hreflang"
        />
      </template>
      <template v-for="meta in head.meta" :key="meta.id ?? meta.key">
        <Meta
          :id="meta.id ?? meta.key"
          :property="meta.property"
          :content="meta.content"
        />
      </template>
    </Head>
    <Body>
      <section class="relative z-0 flex min-h-screen flex-col bg-background">
        <ClientOnly>
          <AntfuCanvasBackground />
        </ClientOnly>
        <Header />
        <main class="relative z-10 flex-1">
          <NuxtPage />
        </main>
        <Footer />
      </section>
    </Body>
  </Html>
</template>

<style></style>
