<script setup lang="ts">
import { ref } from 'vue'

import RsEllipsisText from '~/components/rs-ellipsis-text/ellipsis-text.vue'
import RsLoading from '~/components/rs-loading/loading.vue'
import RsSpinner from '~/components/rs-spinner/spinner.vue'
import RsTooltip from '~/components/rs-tooltip/rs-tooltip.vue'

definePageMeta({
  title: '组件 Demo',
})

type Placement = 'top' | 'bottom' | 'left' | 'right'

const longText
  = '这是一段用于演示「省略文本 + Tooltip + 可点击展开」的长内容。通过调整行数、Tooltip 显示策略与展开开关，你可以直观看到省略检测与交互行为。'

// @rs-ellipsis-text
const ellipsisLine = ref<1 | 2>(1)
const ellipsisMaxWidth = ref(220)
const ellipsisPlacement = ref<Placement>('top')
const ellipsisTooltip = ref(true)
const ellipsisTooltipWhenEllipsis = ref(true)
const ellipsisExpand = ref(true)
const ellipsisExpanded = ref(false)

// @rs-loading
const loadingSpinning = ref(false)
const loadingMinLoadingTime = ref(500)
const loadingText = ref('加载中...')
const loadingDuration = ref(2000)

// @rs-spinner
const spinning = ref(false)
const spinnerMinLoadingTime = ref(800)

function startLoading() {
  loadingSpinning.value = true
  window.setTimeout(() => {
    loadingSpinning.value = false
  }, loadingDuration.value)
}

function startSpinner() {
  spinning.value = true
  window.setTimeout(() => {
    spinning.value = false
  }, 1200)
}

// @rs-tooltip
const tooltipDelayDuration = ref(250)
const tooltipSide = ref<Placement>('right')
const tooltipBg = ref('#111827')
const tooltipColor = ref('#F9FAFB')
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-10 p-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold">
        组件使用 Demo
      </h1>
      <p class="text-sm text-muted-foreground">
        包含：`@rs-ellipsis-text`、`@rs-loading`、`@rs-spinner`、`@rs-tooltip`
      </p>
    </header>

    <section class="space-y-4 rounded-lg border p-4">
      <h2 class="text-lg font-medium">
        @rs-ellipsis-text
      </h2>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex items-center justify-between gap-3 text-sm">
          <span>行数</span>
          <select v-model.number="ellipsisLine" class="rounded-md border px-2 py-1">
            <option :value="1">
              1
            </option>
            <option :value="2">
              2
            </option>
          </select>
        </label>

        <label class="flex items-center justify-between gap-3 text-sm">
          <span>最大宽度(px)</span>
          <input
            v-model.number="ellipsisMaxWidth"
            class="w-24 rounded-md border px-2 py-1"
            type="number"
            min="80"
            max="600"
          >
        </label>

        <label class="flex items-center justify-between gap-3 text-sm">
          <span>Tooltip</span>
          <input v-model="ellipsisTooltip" type="checkbox">
        </label>

        <label class="flex items-center justify-between gap-3 text-sm">
          <span>仅省略时显示</span>
          <input
            v-model="ellipsisTooltipWhenEllipsis"
            type="checkbox"
            :disabled="!ellipsisTooltip"
          >
        </label>

        <label class="flex items-center justify-between gap-3 text-sm">
          <span>点击展开</span>
          <input v-model="ellipsisExpand" type="checkbox">
        </label>

        <label class="flex items-center justify-between gap-3 text-sm">
          <span>Tooltip 位置</span>
          <select v-model="ellipsisPlacement" class="rounded-md border px-2 py-1">
            <option value="top">
              top
            </option>
            <option value="bottom">
              bottom
            </option>
            <option value="left">
              left
            </option>
            <option value="right">
              right
            </option>
          </select>
        </label>
      </div>

      <div class="space-y-3">
        <div class="text-xs text-muted-foreground">
          展开状态：{{ ellipsisExpanded ? '已展开' : '未展开' }}
        </div>
        <div class="max-w-[360px]">
          <RsEllipsisText
            :expand="ellipsisExpand"
            :line="ellipsisLine"
            :max-width="ellipsisMaxWidth"
            :placement="ellipsisPlacement"
            :tooltip="ellipsisTooltip"
            :tooltip-when-ellipsis="ellipsisTooltipWhenEllipsis"
            @expand-change="(v) => { ellipsisExpanded = v }"
          >
            <p>
              {{ longText }}
            </p>
          </RsEllipsisText>
        </div>
      </div>
    </section>

    <section class="space-y-4 rounded-lg border p-4">
      <h2 class="text-lg font-medium">
        @rs-loading
      </h2>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex items-center justify-between gap-3 text-sm">
          <span>最小加载时间(ms)</span>
          <input
            v-model.number="loadingMinLoadingTime"
            class="w-24 rounded-md border px-2 py-1"
            type="number"
            min="0"
            max="5000"
          >
        </label>

        <label class="flex items-center justify-between gap-3 text-sm">
          <span>模拟持续(ms)</span>
          <input
            v-model.number="loadingDuration"
            class="w-24 rounded-md border px-2 py-1"
            type="number"
            min="0"
            max="8000"
          >
        </label>
      </div>

      <RsLoading
        :spinning="loadingSpinning"
        :min-loading-time="loadingMinLoadingTime"
        :text="loadingText"
      >
        <div class="space-y-3 p-1">
          <div class="text-sm font-medium">
            内容区域（加载时会被遮罩）
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loadingSpinning"
              @click="startLoading"
            >
              开始加载
            </button>
            <span class="text-xs text-muted-foreground">
              spinning：{{ loadingSpinning }}
            </span>
          </div>
        </div>
      </RsLoading>
    </section>

    <section class="space-y-4 rounded-lg border p-4">
      <h2 class="text-lg font-medium">
        @rs-spinner
      </h2>

      <label class="flex items-center justify-between gap-3 text-sm">
        <span>最小加载时间(ms)</span>
        <input
          v-model.number="spinnerMinLoadingTime"
          class="w-24 rounded-md border px-2 py-1"
          type="number"
          min="0"
          max="5000"
        >
      </label>

      <div class="relative h-24 max-w-md rounded-md border p-3">
        <RsSpinner :spinning="spinning" :min-loading-time="spinnerMinLoadingTime" />
        <div class="relative z-10 flex h-full items-center justify-between gap-3">
          <div>
            <div class="text-sm font-medium">
              遮罩旋转加载（需要父容器 `relative`）
            </div>
            <div class="text-xs text-muted-foreground">
              spinning：{{ spinning }}
            </div>
          </div>
          <button
            class="rounded-md border px-3 py-2 text-sm hover:bg-accent"
            :disabled="spinning"
            @click="startSpinner"
          >
            触发
          </button>
        </div>
      </div>
    </section>

    <section class="space-y-4 rounded-lg border p-4">
      <h2 class="text-lg font-medium">
        @rs-tooltip
      </h2>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex items-center justify-between gap-3 text-sm">
          <span>延迟(ms)</span>
          <input
            v-model.number="tooltipDelayDuration"
            class="w-24 rounded-md border px-2 py-1"
            type="number"
            min="0"
            max="5000"
          >
        </label>

        <label class="flex items-center justify-between gap-3 text-sm">
          <span>方向(side)</span>
          <select v-model="tooltipSide" class="rounded-md border px-2 py-1">
            <option value="top">
              top
            </option>
            <option value="bottom">
              bottom
            </option>
            <option value="left">
              left
            </option>
            <option value="right">
              right
            </option>
          </select>
        </label>

        <label class="flex items-center justify-between gap-3 text-sm">
          <span>背景色</span>
          <input v-model="tooltipBg" class="w-40 rounded-md border px-2 py-1" type="text">
        </label>

        <label class="flex items-center justify-between gap-3 text-sm">
          <span>文字色</span>
          <input v-model="tooltipColor" class="w-40 rounded-md border px-2 py-1" type="text">
        </label>
      </div>

      <div class="flex items-center gap-4">
        <RsTooltip
          :delay-duration="tooltipDelayDuration"
          :side="tooltipSide"
          :content-style="{ backgroundColor: tooltipBg, color: tooltipColor }"
        >
          <div class="space-y-1">
            <div class="text-sm font-semibold">
              这是 Tooltip 内容
            </div>
            <div class="text-xs opacity-80">
              可配置 delay / side / 样式。
            </div>
          </div>

          <template #trigger>
            <button class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">
              悬停查看
            </button>
          </template>
        </RsTooltip>
      </div>
    </section>
  </div>
</template>

