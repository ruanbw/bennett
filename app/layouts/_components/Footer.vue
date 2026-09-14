<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'

const route = useRoute()

useHead({
  script: [
    {
      key: 'busuanzi',
      src: 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js',
      async: true,
    },
  ],
})

function refreshBusuanzi() {
  if (import.meta.server)
    return

  const win = window as any
  if (win.bszCaller && win.bszTag) {
    win.bszCaller.fetch('//busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback', (data: any) => {
      win.bszTag.texts(data)
      win.bszTag.shows()
    })
  }
}

onMounted(() => {
  refreshBusuanzi()
})

watch(
  () => route.fullPath,
  () => {
    nextTick(() => {
      refreshBusuanzi()
    })
  },
)
</script>

<template>
  <footer class="p-4">
    <div class="flex flex-col items-center justify-center gap-1.5 border-t border-border/80 pt-4 text-center text-sm text-muted-foreground">
      <ClientOnly>
        <div class="flex flex-wrap items-center justify-center text-xs text-muted-foreground/80">
          <span id="busuanzi_container_site_pv" style="display: none;">
            总访问量
            <span id="busuanzi_value_site_pv" class="ml-1 font-medium tabular-nums text-foreground">--</span>
            <span class="ml-0.5">次</span>
          </span>
          <span
            id="busuanzi_container_site_uv"
            style="display: none;"
            class="before:mx-2 before:text-muted-foreground/40 before:content-['·']"
          >
            总访客数
            <span id="busuanzi_value_site_uv" class="ml-1 font-medium tabular-nums text-foreground">--</span>
            <span class="ml-0.5">人</span>
          </span>
        </div>
      </ClientOnly>
      <p>Copyright © 2026 Bennett</p>
    </div>
  </footer>
</template>
