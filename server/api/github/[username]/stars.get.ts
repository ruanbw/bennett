interface GitHubOrgItem {
  login: string
}

interface GitHubRepoLite {
  stargazers_count: number
  fork: boolean
  name: string
}

function isLikelyGitHubUsername(value: string) {
  if (value.length < 1 || value.length > 39)
    return false
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value)
}

async function fetchAllRepos(baseUrl: string, headers: Record<string, string>): Promise<GitHubRepoLite[]> {
  const all: GitHubRepoLite[] = []
  const maxPages = 10 // 最多 1000 个仓库，避免无限循环
  for (let page = 1; page <= maxPages; page++) {
    const sep = baseUrl.includes('?') ? '&' : '?'
    const url = `${baseUrl}${sep}page=${page}`
    const chunk = await $fetch<GitHubRepoLite[]>(url, { headers }).catch(() => [] as GitHubRepoLite[])
    if (!chunk.length)
      break
    all.push(...chunk)
    if (chunk.length < 100)
      break
  }
  return all
}

export default defineCachedEventHandler(async (event) => {
  const raw = getRouterParam(event, 'username')
  const username = raw?.trim() ?? ''

  if (!isLikelyGitHubUsername(username)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid GitHub username' })
  }

  const { githubToken } = useRuntimeConfig(event)
  const headers: Record<string, string> = {
    'accept': 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  }
  if (githubToken)
    headers.Authorization = `Bearer ${githubToken}`

  const qUsername = encodeURIComponent(username)

  try {
    // 校验用户存在（也是为了让 404 语义正确）顺带拿到 public_repos 作预期
    const userCheckUrl = `https://api.github.com/users/${qUsername}`
    const orgsUrl = `https://api.github.com/users/${qUsername}/orgs?per_page=100`

    // 并行：用户校验 + 组织列表 + 个人仓库全量分页
    const [userExists, orgs, personalRepos] = await Promise.all([
      $fetch<{ login: string }>(userCheckUrl, { headers }).then(() => true).catch((e: unknown) => {
        const sc = typeof e === 'object' && e !== null && 'statusCode' in e ? Number((e as { statusCode?: number }).statusCode) : undefined
        if (sc === 404)
          throw createError({ statusCode: 404, statusMessage: 'GitHub user not found' })
        throw e
      }),
      $fetch<GitHubOrgItem[]>(orgsUrl, { headers }).catch(() => [] as GitHubOrgItem[]),
      fetchAllRepos(`https://api.github.com/users/${qUsername}/repos?per_page=100&type=public&sort=updated`, headers),
    ])

    void userExists

    // 拉取每个组织的公开仓库（全量分页，并发）
    const orgResults = await Promise.all(
      orgs.map(async (o) => {
        const repos = await fetchAllRepos(
          `https://api.github.com/orgs/${encodeURIComponent(o.login)}/repos?per_page=100&type=public&sort=updated`,
          headers,
        )
        return { login: o.login, repos }
      }),
    )

    function sumStars(repos: GitHubRepoLite[], excludeForks = true) {
      return repos.reduce((acc, r) => {
        if (excludeForks && r.fork)
          return acc
        return acc + Math.max(0, r.stargazers_count || 0)
      }, 0)
    }

    function countRepos(repos: GitHubRepoLite[], excludeForks = true) {
      return repos.filter(r => (excludeForks ? !r.fork : true)).length
    }

    const excludeForks = true

    const personalStars = sumStars(personalRepos, excludeForks)
    const personalCount = countRepos(personalRepos, excludeForks)

    const orgBreakdown = orgResults.map(({ login, repos }) => ({
      login,
      stars: sumStars(repos, excludeForks),
      reposCount: countRepos(repos, excludeForks),
      totalReposCount: repos.length,
      forkReposCount: repos.filter(r => r.fork).length,
    }))

    const orgStars = orgBreakdown.reduce((s, o) => s + o.stars, 0)
    const totalStars = personalStars + orgStars
    const totalRepos = personalCount + orgBreakdown.reduce((s, o) => s + o.reposCount, 0)

    // 浏览器与 CDN 缓存 1 小时，兼顾实时性与限额
    setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600')
    setHeader(event, 'CDN-Cache-Control', 'public, max-age=3600')

    return {
      username,
      totalStars,
      totalRepos,
      personalStars,
      personalReposCount: personalCount,
      orgs: orgBreakdown,
      orgCount: orgs.length,
      excludeForks,
      updatedAt: new Date().toISOString(),
    }
  }
  catch (err: unknown) {
    // 透传已知 HTTP 错误
    if (typeof err === 'object' && err !== null && 'statusCode' in err) {
      const sc = Number((err as { statusCode?: number }).statusCode)
      if (sc === 400 || sc === 404)
        throw err
    }
    // 解析 GitHub 限额等错误
    const msg = err instanceof Error ? err.message : ''
    const isRate = /rate limit|API rate limit/i.test(msg)
    throw createError({
      statusCode: isRate ? 429 : 502,
      statusMessage: isRate ? 'GitHub API rate limit exceeded, please retry later' : 'Failed to aggregate stars from GitHub',
    })
  }
}, {
  maxAge: 60 * 60, // Nitro 侧缓存 1 小时
  group: 'github-stars',
  name: 'github-stars',
  getKey: (event) => {
    const u = getRouterParam(event, 'username')?.trim().toLowerCase() ?? 'unknown'
    return `github-stars:${u}`
  },
})
