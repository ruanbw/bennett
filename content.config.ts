import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

/**
 * 博客集合：文件位于 content/blog/，站点路径前缀为 /blogs（与 app/pages/blogs 一致）。
 * Frontmatter：title、date（ISO 字符串）、description（可选）。
 */
export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: {
        include: 'blog/**/*.md',
        prefix: '/blogs',
      },
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date(),
      }),
    }),
  },
})
