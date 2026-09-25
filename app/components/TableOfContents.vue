<script setup lang="ts">
import type { TocLink } from '@nuxtjs/mdc'

/**
 * 文章目录：桌面端作为右侧 sticky 栏，移动端折叠为顶部的 <details>。
 * 视觉沿用编辑排版风：小号大写标签 + 细左线 + 当前项高亮。
 */
const props = defineProps<{
  links: TocLink[]
}>()

/** 滚到标题上方多少 px 算「已读」，与吸顶 header 的高度相关 */
const SCROLL_OFFSET = 96

const activeId = ref('')

/** 展平成 [link, depth] 便于线性渲染与查找，忽略更深的三级以下标题 */
const flat = computed(() => {
  const out: { link: TocLink, depth: number }[] = []
  const walk = (links: TocLink[], depth: number) => {
    for (const link of links) {
      if (depth > 3)
        continue
      out.push({ link, depth })
      if (link.children?.length)
        walk(link.children, depth + 1)
    }
  }
  walk(props.links, 2)
  return out
})

function syncActive() {
  let current = ''
  for (const { link } of flat.value) {
    const el = document.getElementById(link.id)
    if (!el)
      continue
    if (el.getBoundingClientRect().top - SCROLL_OFFSET <= 0)
      current = link.id
    else
      break
  }
  // 滚到底部时强制高亮最后一项，否则末尾短章节永远无法点亮
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4)
    current = flat.value.at(-1)?.link.id ?? current
  activeId.value = current || flat.value[0]?.link.id || ''
}

let ticking = false
function onScroll() {
  if (ticking)
    return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    syncActive()
  })
}

onMounted(() => {
  syncActive()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <nav
    v-if="flat.length"
    aria-label="目录"
    class="border-l border-border pl-5 text-sm"
  >
    <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
      目录
    </p>
    <ul class="mt-4 space-y-2.5">
      <li v-for="{ link, depth } in flat" :key="link.id">
        <a
          :href="`#${link.id}`"
          class="block border-l-2 py-0.5 leading-snug transition-colors"
          :class="[
            depth > 2 ? 'pl-6 text-xs' : 'pl-0 text-[13px]',
            activeId === link.id
              ? '-ml-px border-foreground text-foreground'
              : '-ml-px border-transparent text-muted-foreground hover:text-foreground',
          ]"
          :aria-current="activeId === link.id ? 'location' : undefined"
          @click="activeId = link.id"
        >
          {{ link.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>
