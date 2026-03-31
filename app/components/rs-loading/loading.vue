<script lang="ts" setup>
import { cn } from '~/lib/utils'
import { RsLoading } from '../rs-spinner/exports'

interface LoadingProps {
  class?: string
  /**
   * @zh_CN 最小加载时间
   * @en_US Minimum loading time
   */
  minLoadingTime?: number

  /**
   * @zh_CN loading状态开启
   */
  spinning?: boolean
  /**
   * @zh_CN 文字
   */
  text?: string
}

defineOptions({ name: 'RsLoading' })
const props = defineProps<LoadingProps>()
</script>

<template>
  <div :class="cn('relative min-h-20', props.class)">
    <slot />
    <RsLoading
      :min-loading-time="props.minLoadingTime"
      :spinning="props.spinning"
      :text="props.text"
    >
      <template v-if="$slots.icon" #icon>
        <slot name="icon" />
      </template>
    </RsLoading>
  </div>
</template>
