<script setup lang="ts">
/**
 * 编辑排版风的分区标题：编号 + 大写小标题 + 右侧可选操作，底部一条 1px 分割线。
 * 首页与各列表页共用，避免各页面重复这套「编号 + 细线」的标记。
 */
defineProps<{
  /** 分区编号，如 '01' */
  index?: string
  /** 分区标题，大写显示 */
  title: string
  /** 标题的 aria-label，不传则用 title */
  label?: string
  /** 落到 h2 上的 id，供外层 section 的 aria-labelledby 引用 */
  id?: string
}>()
</script>

<template>
  <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b border-border pb-4">
    <h2 :id="id" class="flex items-baseline gap-4">
      <span
        v-if="index"
        class="text-[11px] font-medium tabular-nums tracking-[0.18em] text-muted-foreground/60"
      >{{ index }}</span>
      <span
        class="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground"
        :aria-label="label"
      >{{ title }}</span>
    </h2>
    <slot />
  </div>
</template>
