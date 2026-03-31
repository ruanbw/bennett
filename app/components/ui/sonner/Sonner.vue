<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { reactiveOmit } from '@vueuse/core'
import { Toaster as Sonner } from 'vue-sonner'

const props = defineProps<ToasterProps>()
const delegatedProps = reactiveOmit(props, 'toastOptions')
</script>

<template>
  <Sonner
    class="toaster group"
    :toast-options="{
      classes: {
        toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton:
          'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton:
          'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    }"
    v-bind="delegatedProps"
  >
    <template #success-icon>
      <Icon name="carbon:checkmark" class="size-4 text-green-500" />
    </template>
    <template #info-icon>
      <Icon name="carbon:information" class="size-4 text-blue-500" />
    </template>
    <template #warning-icon>
      <Icon name="carbon:warning" class="size-4 text-yellow-500" />
    </template>
    <template #error-icon>
      <Icon name="carbon:error" class="size-4 text-red-500" />
    </template>
    <template #loading-icon>
      <div>
        <Icon name="carbon:circle-dash" class="size-4 animate-spin text-gray-500" />
      </div>
    </template>
    <template #close-icon>
      <Icon name="carbon:close" class="size-4 text-gray-500" />
    </template>
  </Sonner>
</template>
