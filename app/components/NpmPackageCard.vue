<script setup lang="ts">
import type { NpmPackageStat } from '~/server/api/npm/stats.get'

const props = defineProps<{
  pkg: NpmPackageStat
  maxWeek: number
  maxMonth: number
  active: 'week' | 'month'
}>()

function formatInt(n: number) {
  return new Intl.NumberFormat(undefined).format(n)
}

function formatCompact(n: number) {
  return new Intl.NumberFormat(undefined, { notation: n >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n)
}

const barPercent = computed(() => {
  const max = props.active === 'week' ? props.maxWeek : props.maxMonth
  const v = props.active === 'week' ? props.pkg.downloads.lastWeek : props.pkg.downloads.lastMonth
  if (!max)
    return 0
  return Math.max(4, Math.round((v / max) * 100))
})

const barColor = computed(() => {
  // stable hue per package name (avoid extra dep)
  let h = 2166136261
  for (let i = 0; i < props.pkg.name.length; i++)
    h = Math.imul(h ^ props.pkg.name.charCodeAt(i), 16777619)
  return Math.abs(h) % 360
})
</script>

<template>
  <a
    :href="pkg.npmUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="group flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 backdrop-blur transition-colors hover:bg-background hover:shadow-sm supports-[backdrop-filter]:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="truncate font-mono text-sm font-semibold text-foreground group-hover:underline underline-offset-4">{{ pkg.name }}</span>
          <span
            v-if="pkg.version"
            class="shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 font-mono text-[11px] leading-none text-muted-foreground"
          >v{{ pkg.version }}</span>
        </div>
        <p
          v-if="pkg.description"
          class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
          :title="pkg.description"
        >
          {{ pkg.description }}
        </p>
        <p v-else class="mt-1 text-xs italic text-muted-foreground/70">暂无描述</p>
      </div>
      <Icon name="carbon:arrow-up-right" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground" aria-hidden="true" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-lg bg-muted/30 px-3 py-2" :class="active === 'week' ? 'ring-1 ring-border bg-muted/40' : ''">
        <div class="text-[11px] tracking-wide text-muted-foreground uppercase" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">近一周</div>
        <div class="mt-1 flex items-baseline gap-1">
          <span class="text-lg font-semibold tabular-nums text-foreground" :title="formatInt(pkg.downloads.lastWeek)">{{ formatCompact(pkg.downloads.lastWeek) }}</span>
          <span class="text-[11px] text-muted-foreground" :title="formatInt(pkg.downloads.lastWeek)">次</span>
        </div>
      </div>
      <div class="rounded-lg bg-muted/30 px-3 py-2" :class="active === 'month' ? 'ring-1 ring-border bg-muted/40' : ''">
        <div class="text-[11px] tracking-wide text-muted-foreground uppercase" style="font-family: 'DM Sans', ui-sans-serif, system-ui;">近一月</div>
        <div class="mt-1 flex items-baseline gap-1">
          <span class="text-lg font-semibold tabular-nums text-foreground" :title="formatInt(pkg.downloads.lastMonth)">{{ formatCompact(pkg.downloads.lastMonth) }}</span>
          <span class="text-[11px] text-muted-foreground" :title="formatInt(pkg.downloads.lastMonth)">次</span>
        </div>
      </div>
    </div>

    <div class="h-1.5 overflow-hidden rounded-full bg-muted" role="presentation" :aria-label="`${active === 'week' ? '周' : '月'}下载占比`">
      <div
        class="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500"
        :style="{ width: `${barPercent}%`, background: `oklch(0.60 0.14 ${barColor})` }"
      />
    </div>
  </a>
</template>
