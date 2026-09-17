function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

export default defineEventHandler(async (event) => {
  const siteUrl = 'https://bennett-website.vercel.app'
  const siteName = 'Bennett - 前端工程化与 Nuxt 实战'
  const siteDescription = 'Bennett 的个人站：关注前端工程化、Vue/Nuxt 性能优化与开发者体验，分享实战博客与开源项目。'

  let posts: Array<{ title: string, path: string, description?: string, date: string | Date }> = []
  try {
    posts = await queryCollection(event, 'blog')
      .select('title', 'path', 'description', 'date')
      .order('date', 'DESC')
      .all() as typeof posts
  }
  catch {
    posts = []
  }

  const items = posts.map((post) => {
    const link = `${siteUrl}${post.path}`
    const pubDate = new Date(post.date).toUTCString()
    return [
      '    <item>',
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      post.description ? `      <description>${escapeXml(post.description)}</description>` : null,
      `      <pubDate>${escapeXml(pubDate)}</pubDate>`,
      '    </item>',
    ].filter(Boolean).join('\n')
  }).join('\n')

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(siteName)}</title>`,
    `    <link>${escapeXml(siteUrl)}/</link>`,
    `    <description>${escapeXml(siteDescription)}</description>`,
    '    <language>zh-CN</language>',
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, s-maxage=3600, stale-while-revalidate=600')
  return xml
})
