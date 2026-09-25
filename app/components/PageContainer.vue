<script setup lang="ts">
/**
 * 页面容器：与首页同宽（max-w-6xl）同边距，保证各页栅格对齐。
 * 垂直留白交给各页自己控制，与首页的分区间距保持同一套节奏。
 */
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
    <slot />
  </div>
</template>
