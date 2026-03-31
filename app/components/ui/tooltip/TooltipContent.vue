<script setup lang="ts">
import type { TooltipContentEmits, TooltipContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TooltipContent, TooltipPortal, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TooltipContentProps & { class?: HTMLAttributes["class"] }>(), {
  sideOffset: 4,
})

const emits = defineEmits<TooltipContentEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// 只把 props 传给 reka-ui，不传 style/class 等 attr，避免其内部多根/Teleport 无法继承而报警
const contentBind = { ...forwarded }
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      v-bind="contentBind"
      :class="cn('z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2', props.class)"
    >
      <!-- 单根包裹并承接 style/class，消除 "Extraneous non-props attributes (style)" 警告 -->
      <div v-bind="$attrs">
        <slot />
      </div>
    </TooltipContent>
  </TooltipPortal>
</template>
