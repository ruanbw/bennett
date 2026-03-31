# EllipsisText 组件

## 简介

EllipsisText 是一个功能强大的文本省略组件，支持单行和多行文本省略，并提供 Tooltip 提示和点击展开功能。

## 功能特性

- ✅ 支持单行和多行文本省略
- ✅ 可选的 Tooltip 提示框
- ✅ 可选的点击展开功能
- ✅ 智能检测文本是否被截断
- ✅ 自定义样式和配置
- ✅ 响应式尺寸监听

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `expand` | `boolean` | `false` | 是否启用点击文本展开全部 |
| `line` | `number` | `1` | 文本最大行数 |
| `maxWidth` | `number \| string` | `'100%'` | 文本最大宽度 |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 提示框位置 |
| `tooltip` | `boolean` | `true` | 是否启用文本提示框 |
| `tooltipWhenEllipsis` | `boolean` | `false` | 是否只在文本被截断时显示提示框 |
| `ellipsisThreshold` | `number` | `3` | 文本截断检测的像素差异阈值 |
| `tooltipBackgroundColor` | `string` | `''` | 提示框背景颜色 |
| `tooltipColor` | `string` | `''` | 提示文本字体颜色 |
| `tooltipFontSize` | `number` | `14` | 提示文本字体大小（px） |
| `tooltipMaxWidth` | `number` | `undefined` | 提示框内容最大宽度（px） |
| `tooltipOverlayStyle` | `CSSProperties` | `{ textAlign: 'justify' }` | 提示框内容区域样式 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `expandChange` | `(expanded: boolean)` | 展开状态改变时触发 |

## 使用示例

### 基础用法

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
</script>

<template>
  <div class="w-64">
    <EllipsisText>
      <p>这是一段很长的文本，当文本超出容器宽度时会被省略显示。</p>
    </EllipsisText>
  </div>
</template>
```

### 多行省略

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
</script>

<template>
  <div class="w-64">
    <!-- 显示最多 3 行 -->
    <EllipsisText :line="3">
      <p>
        这是一段很长的文本内容，当文本超出指定的行数时会被省略显示。
        支持多行文本的省略，非常适合用于文章摘要、商品描述等场景。
      </p>
    </EllipsisText>
  </div>
</template>
```

### 自定义宽度

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
</script>

<template>
  <div>
    <!-- 使用像素值 -->
    <EllipsisText :max-width="200">
      <p>这是一段文本，最大宽度为 200px</p>
    </EllipsisText>

    <!-- 使用百分比 -->
    <EllipsisText max-width="50%">
      <p>这是一段文本，最大宽度为容器的 50%</p>
    </EllipsisText>
  </div>
</template>
```

### 禁用 Tooltip

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
</script>

<template>
  <div class="w-64">
    <EllipsisText :tooltip="false">
      <p>这是一段文本，不显示 Tooltip 提示</p>
    </EllipsisText>
  </div>
</template>
```

### 只在截断时显示 Tooltip

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
</script>

<template>
  <div class="w-64">
    <EllipsisText :tooltip-when-ellipsis="true">
      <p>这是一段文本，只有当文本被截断时才显示 Tooltip</p>
    </EllipsisText>
  </div>
</template>
```

### 点击展开功能

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
import { ref } from 'vue'

const isExpanded = ref(false)

function handleExpandChange(expanded: boolean) {
  isExpanded.value = expanded
  console.log('展开状态:', expanded)
}
</script>

<template>
  <div class="w-64">
    <EllipsisText :expand="true" :line="2" @expand-change="handleExpandChange">
      <p>
        这是一段很长的文本内容，点击文本可以展开查看完整内容。
        当文本被截断时，点击可以展开，再次点击可以收起。
      </p>
    </EllipsisText>
  </div>
</template>
```

### 自定义 Tooltip 样式

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
</script>

<template>
  <div class="w-64">
    <EllipsisText
      :tooltip-background-color="'#333'"
      :tooltip-color="'#fff'"
      :tooltip-font-size="14"
      :tooltip-max-width="300"
      placement="bottom"
    >
      <p>这是一段文本，Tooltip 使用自定义样式</p>
    </EllipsisText>
  </div>
</template>
```

### 自定义 Tooltip 内容

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
</script>

<template>
  <div class="w-64">
    <EllipsisText>
      <template #tooltip>
        <div>
          <p>这是自定义的 Tooltip 内容</p>
          <p>可以包含任何内容</p>
        </div>
      </template>
      <p>这是一段文本，使用自定义的 Tooltip 内容</p>
    </EllipsisText>
  </div>
</template>
```

### 调整截断检测阈值

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
</script>

<template>
  <div class="w-64">
    <!-- 更严格的截断检测（阈值更大） -->
    <EllipsisText :ellipsis-threshold="10" :tooltip-when-ellipsis="true">
      <p>这是一段文本，使用更大的截断检测阈值</p>
    </EllipsisText>
  </div>
</template>
```

## 实际应用场景

### 表格单元格

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
</script>

<template>
  <table>
    <tr>
      <td class="w-32">
        <EllipsisText :tooltip-when-ellipsis="true">
          <span>这是一段很长的文本内容</span>
        </EllipsisText>
      </td>
    </tr>
  </table>
</template>
```

### 列表项

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'

const items = [
  { title: '标题1', description: '这是一段很长的描述文本...' },
  { title: '标题2', description: '这是另一段很长的描述文本...' },
]
</script>

<template>
  <div class="space-y-4">
    <div v-for="item in items" :key="item.title" class="border p-4">
      <h3>{{ item.title }}</h3>
      <EllipsisText :line="2" :expand="true">
        <p>{{ item.description }}</p>
      </EllipsisText>
    </div>
  </div>
</template>
```

### 卡片内容

```vue
<script setup lang="ts">
import { EllipsisText } from '~/components/ellipsis-text'
</script>

<template>
  <div class="card w-64 p-4">
    <h2>卡片标题</h2>
    <EllipsisText :line="3" :tooltip-when-ellipsis="true">
      <p>
        这是卡片的描述内容，当内容过长时会被省略显示。
        用户可以通过 Tooltip 查看完整内容。
      </p>
    </EllipsisText>
  </div>
</template>
```

## 注意事项

1. **截断检测**：`tooltipWhenEllipsis` 功能使用 `ResizeObserver` 监听元素尺寸变化，自动检测文本是否被截断
2. **性能优化**：组件使用 `@vueuse/core` 的 `useElementSize` 进行响应式尺寸监听
3. **样式覆盖**：组件会自动添加必要的 CSS 类，如需自定义样式，可以通过 `class` 属性传递
4. **展开功能**：启用 `expand` 后，点击文本区域可以切换展开/收起状态
5. **Tooltip 位置**：可以通过 `placement` 属性控制 Tooltip 的显示位置

## 导出

```typescript
import { EllipsisText } from '~/components/ellipsis-text'
```
