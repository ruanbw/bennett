<script setup lang="ts">
/**
 * 项目条目：封面图 + 标题 + 描述 + 技术栈，无边框无圆角。
 * 首页「01 SELECTED WORK」与 /projects 列表共用，保证两处呈现完全一致。
 */
export interface ProjectEntryData {
  path: string
  title: string
  description: string
  cover: string
  tags?: string[]
}

defineProps<{
  project: ProjectEntryData
}>()
</script>

<template>
  <NuxtLink
    :to="project.path"
    class="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
  >
    <div class="aspect-[4/3] overflow-hidden bg-muted/40">
      <NuxtImg
        :src="project.cover"
        :alt="project.title"
        width="800"
        height="600"
        sizes="100vw sm:50vw lg:33vw"
        quality="80"
        format="webp"
        loading="lazy"
        decoding="async"
        class="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    </div>
    <div class="mt-5 flex items-baseline justify-between gap-4">
      <h3 class="font-display text-[22px] leading-tight">
        {{ project.title }}
      </h3>
      <Icon
        name="carbon:arrow-up-right"
        class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden="true"
      />
    </div>
    <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
      {{ project.description }}
    </p>
    <p
      v-if="project.tags?.length"
      class="mt-3 truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70"
    >
      {{ project.tags.slice(0, 3).join(' / ') }}
    </p>
  </NuxtLink>
</template>
