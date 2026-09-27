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
    /**
     * 项目集合：文件位于 content/projects/，站点路径前缀为 /projects（与 app/pages/projects 一致）。
     * Frontmatter：title、description、url（可选，仅已公开项目填；未上架的不编造外链）、cover（封面图）、
     * video（可选演示视频）、images（可选截图列表）、tags（技术栈标签）、date。
     */
    projects: defineCollection({
      type: 'page',
      source: {
        include: 'projects/**/*.md',
        prefix: '/projects',
      },
      schema: z.object({
        title: z.string(),
        description: z.string(),
        url: z.string().optional(),
        cover: z.string(),
        video: z.string().optional(),
        images: z.array(z.string()).default([]),
        tags: z.array(z.string()).default([]),
        date: z.coerce.date(),
      }),
    }),
  },
})
