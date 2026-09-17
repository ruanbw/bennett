import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { queryCollection } from '@nuxt/content/server'

interface SitemapEntry {
  loc: string
  lastmod?: string
}

const STATIC_PAGES: SitemapEntry[] = [
  { loc: '/' },
  { loc: '/blogs' },
  { loc: '/projects' },
]

function toLastmod(date: unknown): string | undefined {
  if (!date)
    return undefined
  const d = date instanceof Date ? date : new Date(date as string | number)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

/**
 * 降级方案：queryCollection 在 server 不可用时，
 * 直接 glob content/ 目录生成 loc（/blogs/<slug>、/projects/<slug>）。
 */
function fallbackUrlsFromContentDir(): SitemapEntry[] {
  const entries: SitemapEntry[] = [...STATIC_PAGES]
  const mapping = [
    { dir: 'blog', prefix: '/blogs' },
    { dir: 'projects', prefix: '/projects' },
  ] as const
  for (const { dir, prefix } of mapping) {
    try {
      const abs = join(process.cwd(), 'content', dir)
      const files = readdirSync(abs, { recursive: true }) as string[]
      for (const file of files) {
        if (!file.endsWith('.md'))
          continue
        const slug = file.replace(/\.md$/, '').replace(/\\/g, '/')
        // 跳过 index/README 类文件，避免与静态页重复
        if (slug.toLowerCase() === 'index' || slug.toLowerCase() === 'readme')
          continue
        entries.push({ loc: `${prefix}/${slug}` })
      }
    }
    catch {
      // 目录不可读时忽略该集合，至少返回静态页
    }
  }
  return entries
}

export default defineSitemapEventHandler(async (event) => {
  try {
    const [posts, projects] = await Promise.all([
      queryCollection(event, 'blog').select('path', 'date').all(),
      queryCollection(event, 'projects').select('path', 'date').all(),
    ])
    return [
      ...STATIC_PAGES,
      ...posts.map(p => ({ loc: p.path, lastmod: toLastmod(p.date) })),
      ...projects.map(p => ({ loc: p.path, lastmod: toLastmod(p.date) })),
    ] satisfies SitemapEntry[]
  }
  catch {
    return fallbackUrlsFromContentDir()
  }
})
