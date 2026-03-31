<script setup lang="ts">
import { CircleHelp } from 'lucide-vue-next'

import { cn } from '~/lib/utils'

import Tooltip from './rs-tooltip.vue'

defineOptions({
  inheritAttrs: false,
})

defineProps<{ triggerClass?: string }>()
</script>

<template>
  <Tooltip :delay-duration="300" side="right">
    <template #trigger>
      <slot name="trigger">
        <CircleHelp
          :class="
            cn(
              'inline-flex size-5 cursor-pointer text-foreground/80 hover:text-foreground',
              triggerClass,
            )
          "
        />
      </slot>
    </template>
    <slot />
  </Tooltip>
</template>
