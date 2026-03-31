# Loading 组件

## 简介

Loading 组件提供了多种加载状态的展示方式，包括组件和指令两种使用方式。

## 组件

### Loading 组件

带文本提示的加载组件，支持自定义图标和最小加载时间。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `spinning` | `boolean` | `false` | 是否显示加载状态 |
| `minLoadingTime` | `number` | `50` | 最小加载时间（毫秒） |
| `text` | `string` | `''` | 加载提示文字 |
| `class` | `string` | - | 自定义样式类名 |

#### 使用示例

```vue
<script setup lang="ts">
import { Loading } from '~/components/loading'
import { ref } from 'vue'

const isLoading = ref(false)

function handleLoad() {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 2000)
}
</script>

<template>
  <div>
    <!-- 基础用法 -->
    <Loading :spinning="isLoading">
      <div class="p-4">
        <p>这是内容区域</p>
      </div>
    </Loading>

    <!-- 带文字提示 -->
    <Loading :spinning="isLoading" text="加载中...">
      <div class="p-4">
        <p>这是内容区域</p>
      </div>
    </Loading>

    <!-- 自定义图标 -->
    <Loading :spinning="isLoading">
      <template #icon>
        <Icon name="carbon:circle-dash" class="animate-spin" />
      </template>
      <div class="p-4">
        <p>这是内容区域</p>
      </div>
    </Loading>

    <!-- 设置最小加载时间 -->
    <Loading :spinning="isLoading" :min-loading-time="500">
      <div class="p-4">
        <p>这是内容区域</p>
      </div>
    </Loading>

    <button @click="handleLoad">开始加载</button>
  </div>
</template>
```

### Spinner 组件

简单的旋转加载组件，适合轻量级的加载场景。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `spinning` | `boolean` | `false` | 是否显示加载状态 |
| `minLoadingTime` | `number` | `50` | 最小加载时间（毫秒） |
| `class` | `string` | - | 自定义样式类名 |

#### 使用示例

```vue
<script setup lang="ts">
import { Spinner } from '~/components/loading'
import { ref } from 'vue'

const isLoading = ref(false)
</script>

<template>
  <Spinner :spinning="isLoading">
    <div class="p-4">
      <p>这是内容区域</p>
    </div>
  </Spinner>
</template>
```

## 指令

### v-loading 指令

在元素上直接使用 `v-loading` 指令来显示加载状态。

#### 使用方式

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isLoading = ref(false)
</script>

<template>
  <div>
    <!-- 基础用法：直接绑定布尔值 -->
    <div v-loading="isLoading" class="p-4">
      <p>这是内容区域</p>
    </div>

    <!-- 简写：不传值时默认为 true -->
    <div v-loading class="p-4">
      <p>加载中...</p>
    </div>

    <!-- 传递配置对象 -->
    <div v-loading="{ spinning: isLoading, text: '加载中...', minLoadingTime: 500 }" class="p-4">
      <p>这是内容区域</p>
    </div>
  </div>
</template>
```

#### 指令参数

- **布尔值**：直接控制加载状态
- **对象**：可以传递完整的配置
  - `spinning`: 是否显示加载状态
  - `text`: 加载提示文字
  - `minLoadingTime`: 最小加载时间（毫秒）

### v-spinning 指令

在元素上使用 `v-spinning` 指令来显示旋转加载状态。

#### 使用方式

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isLoading = ref(false)
</script>

<template>
  <div>
    <!-- 基础用法 -->
    <div v-spinning="isLoading" class="p-4">
      <p>这是内容区域</p>
    </div>

    <!-- 传递配置对象 -->
    <div v-spinning="{ spinning: isLoading, minLoadingTime: 500 }" class="p-4">
      <p>这是内容区域</p>
    </div>
  </div>
</template>
```

#### 指令参数

- **布尔值**：直接控制加载状态
- **对象**：可以传递完整的配置
  - `spinning`: 是否显示加载状态
  - `minLoadingTime`: 最小加载时间（毫秒）

## 注册指令

指令已通过 `app/plugins/directives.ts` 自动注册，无需手动注册。

如果需要自定义指令名称，可以在插件中配置：

```typescript
// app/plugins/directives.ts
import { registerLoadingDirective } from '~/components/loading/directive'

export default defineNuxtPlugin((app) => {
  const vueApp = app.vueApp
  // 自定义指令名称
  registerLoadingDirective(vueApp, {
    loading: 'custom-loading',  // 将 v-loading 改为 v-custom-loading
    spinning: 'custom-spinning' // 将 v-spinning 改为 v-custom-spinning
  })
})
```

## 实际应用场景

### 异步数据加载

```vue
<script setup lang="ts">
import { Loading } from '~/components/loading'

const { data, pending } = await useFetch('/api/data')
</script>

<template>
  <Loading :spinning="pending">
    <div v-if="data">
      <p>{{ data }}</p>
    </div>
  </Loading>
</template>
```

### 表单提交

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isSubmitting = ref(false)

async function handleSubmit() {
  isSubmitting.value = true
  try {
    await submitForm()
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form v-loading="isSubmitting" @submit.prevent="handleSubmit">
    <!-- 表单内容 -->
  </form>
</template>
```

### 按钮加载状态

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isLoading = ref(false)

async function handleClick() {
  isLoading.value = true
  try {
    await doSomething()
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div v-loading="isLoading" class="relative inline-block">
    <button @click="handleClick">提交</button>
  </div>
</template>
```

## 注意事项

1. **SSR 兼容性**：指令在 SSR 阶段会自动跳过，只在客户端执行
2. **最小加载时间**：设置 `minLoadingTime` 可以避免加载状态闪烁，提升用户体验
3. **容器定位**：使用指令时，容器会自动添加 `position: relative` 样式
4. **性能优化**：组件支持按需渲染，只有在显示时才会渲染加载动画

## 导出

```typescript
// 组件
export { Loading, Spinner } from '~/components/loading'

// 指令注册函数
export { registerLoadingDirective } from '~/components/loading/directive'
```
