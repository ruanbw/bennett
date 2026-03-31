<script setup lang="ts">
import { MoonStar, Sun } from 'lucide-vue-next'

const dark = isDark
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})
</script>

<template>
  <button
    type="button"
    class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
    :aria-label="isMounted ? (dark ? '切换到浅色模式' : '切换到深色模式') : '切换主题'"
    @click="toggleDark($event)"
  >
    <MoonStar v-if="isMounted && dark" class="size-4" />
    <Sun v-else class="size-4" />
  </button>
</template>
