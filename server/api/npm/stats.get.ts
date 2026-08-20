interface NpmSearchPackage {
  name: string
  description: string | undefined
  version: string
  date: string
  links: { npm?: string }
}

interface NpmSearchObject {
  package: NpmSearchPackage
  downloads?: { weekly?: number, monthly?: number }
}

interface NpmSearchResponse {
  objects: NpmSearchObject[]
  total: number
}

interface NpmPointResponse {
  downloads: number
  start: string
  end: string
  package: string
}

export interface NpmPackageStat {
  name: string
  description: string | null
  version: string
  npmUrl: string
  downloads: { lastWeek: number, lastMonth: number, total: number }
}

export interface NpmStatsPayload {
  maintainer: string
  org: string | null
  updatedAt: string
  totals: { packageCount: number, lastWeek: number, lastMonth: number, total: number }
  packages: NpmPackageStat[]
}

function parseWhitelist(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

async function fetchWithTimeout<T>(url: string, ms = 5000): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await $fetch<T>(url, { signal: ctrl.signal })
  }
  finally {
    clearTimeout(t)
  }
}

async function pMapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const ret: R[] = Array.from({ length: items.length })
  let idx = 0
  async function worker() {
    while (true) {
      const cur = idx++
      if (cur >= items.length)
        break
      ret[cur] = await fn(items[cur]!, cur)
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return ret
}

export default defineCachedEventHandler(async (event): Promise<NpmStatsPayload> => {
  const config = useRuntimeConfig(event)
  const maintainer = ((config as Record<string, unknown>).npmMaintainer as string | undefined)?.trim() || 'ruanbw'
  const org = ((config as Record<string, unknown>).npmOrg as string | undefined)?.trim() || ''
  const whitelistRaw = ((config as Record<string, unknown>).npmPackages as string | undefined) || ''
  const whitelist = parseWhitelist(whitelistRaw)

  // 1) discover packages via search API + whitelist
  const searchQueries: string[] = [`maintainer:${maintainer}`]
  if (org)
    searchQueries.push(`scope:${org}`)

  const discovered = new Map<string, { name: string, description: string | null, version: string, npmUrl: string }>()

  let searchSucceeded = false
  for (const q of searchQueries) {
    const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=100`
    try {
      const res = await fetchWithTimeout<NpmSearchResponse>(url, 6000)
      searchSucceeded = true
      for (const obj of res.objects || []) {
        const p = obj.package
        if (!p?.name)
          continue
        if (!discovered.has(p.name)) {
          discovered.set(p.name, {
            name: p.name,
            description: p.description ?? null,
            version: p.version ?? '',
            npmUrl: p.links?.npm || `https://www.npmjs.com/package/${encodeURIComponent(p.name)}`,
          })
        }
      }
    }
    catch (e) {
      console.warn(`[npm-stats] search failed q=${q}`, e instanceof Error ? e.message : e)
    }
  }

  // merge whitelist (guaranteed to appear even if search misses/delays indexing)
  for (const name of whitelist) {
    if (!discovered.has(name)) {
      // try to enrich from registry meta (non-blocking best-effort)
      let description: string | null = null
      let version = ''
      const npmUrl = `https://www.npmjs.com/package/${encodeURIComponent(name)}`
      try {
        const meta = await fetchWithTimeout<{ 'description'?: string, 'dist-tags'?: { latest?: string } }>(`https://registry.npmjs.org/${encodeURIComponent(name)}`, 4000)
        description = meta.description ?? null
        version = meta['dist-tags']?.latest ?? ''
      }
      catch {}
      discovered.set(name, { name, description, version, npmUrl })
    }
  }

  if (!searchSucceeded && discovered.size === 0) {
    throw createError({ statusCode: 502, statusMessage: 'Failed to load npm package list' })
  }

  const packagesMeta = [...discovered.values()]

  // 2) fetch downloads point for each package (week + month + total), concurrency 5
  const today = new Date().toISOString().slice(0, 10)
  const totalRange = `2015-01-10:${today}`
  const packages: NpmPackageStat[] = await pMapLimit(packagesMeta, 5, async (meta) => {
    const enc = encodeURIComponent(meta.name)
    const weekUrl = `https://api.npmjs.org/downloads/point/last-week/${enc}`
    const monthUrl = `https://api.npmjs.org/downloads/point/last-month/${enc}`
    const totalUrl = `https://api.npmjs.org/downloads/point/${totalRange}/${enc}`
    const [w, m, t] = await Promise.all([
      fetchWithTimeout<NpmPointResponse>(weekUrl, 5000).catch(() => ({ downloads: 0 } as NpmPointResponse)),
      fetchWithTimeout<NpmPointResponse>(monthUrl, 5000).catch(() => ({ downloads: 0 } as NpmPointResponse)),
      fetchWithTimeout<NpmPointResponse>(totalUrl, 6000).catch(() => ({ downloads: 0 } as NpmPointResponse)),
    ])
    return {
      name: meta.name,
      description: meta.description,
      version: meta.version,
      npmUrl: meta.npmUrl,
      downloads: {
        lastWeek: Math.max(0, Number(w.downloads) || 0),
        lastMonth: Math.max(0, Number(m.downloads) || 0),
        total: Math.max(0, Number(t.downloads) || 0),
      },
    }
  })

  // 3) totals + sort by lastWeek desc (frontend can re-sort for month tab)
  packages.sort((a, b) => b.downloads.total - a.downloads.total)

  const totals = {
    packageCount: packages.length,
    lastWeek: packages.reduce((s, p) => s + p.downloads.lastWeek, 0),
    lastMonth: packages.reduce((s, p) => s + p.downloads.lastMonth, 0),
    total: packages.reduce((s, p) => s + p.downloads.total, 0),
  }

  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600')
  setHeader(event, 'CDN-Cache-Control', 'public, max-age=3600')

  return {
    maintainer,
    org: org || null,
    updatedAt: new Date().toISOString(),
    totals,
    packages,
  }
}, {
  maxAge: 60 * 60,
  group: 'npm-stats',
  name: 'npm-stats',
  getKey: (event) => {
    const c = useRuntimeConfig(event) as Record<string, unknown>
    const m = (c.npmMaintainer as string | undefined)?.trim().toLowerCase() || 'ruanbw'
    const o = (c.npmOrg as string | undefined)?.trim().toLowerCase() || ''
    const w = (c.npmPackages as string | undefined)?.trim() || ''
    return `npm-stats:${m}:${o}:${w}`
  },
})
