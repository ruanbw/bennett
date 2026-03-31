<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const { locale, locales, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

type Locale = Parameters<typeof setLocale>[0]

// 手动切换语言的函数
async function switchLanguage(newLocale: Locale) {
  // 设置新的语言
  await setLocale(newLocale)
  // 获取当前路径对应的新语言路径
  const path = switchLocalePath(newLocale)
  // 导航到新语言的路径
  await navigateTo(path)
}
</script>

<template>
  <Select v-model="locale" @change="switchLanguage">
    <SelectTrigger>
      <SelectValue placeholder="Select a language" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="locale in locales" :key="locale.code" :value="locale.code">
        {{ locale.name }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
