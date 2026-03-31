interface GitHubUserResponse {
  login: string
  name: string | null
  bio: string | null
  avatar_url: string
  html_url: string
  blog: string | null
  location: string | null
  company: string | null
  twitter_username: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
}

/** 列表接口返回的仓库项（仅用到了语言与 fork / star） */
interface GitHubRepoListItem {
  language: string | null
  fork: boolean
  stargazers_count: number
}

/**
 * 根据公开仓库的主语言字段聚合「常用语言」。
 * 排除 fork；权重 = 1 + log1p(stars)，兼顾仓库数量与关注度。
 * （仅多 1 次 API；若要按字节占比需对每个仓库再请求 /languages，成本更高。）
 */
function computeTopLanguages(repos: GitHubRepoListItem[], limit = 8) {
  const scores = new Map<string, number>()
  for (const r of repos) {
    if (r.fork || !r.language)
      continue
    const w = 1 + Math.log1p(Math.max(0, r.stargazers_count))
    scores.set(r.language, (scores.get(r.language) ?? 0) + w)
  }
  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
  const total = sorted.reduce((s, [, v]) => s + v, 0) || 1
  return sorted.map(([name, score]) => ({
    name,
    /** 在「展示用的前 N 种语言」中的占比（0–100，一位小数） */
    percent: Math.round((score / total) * 1000) / 10,
  }))
}

function isLikelyGitHubUsername(value: string) {
  if (value.length < 1 || value.length > 39)
    return false
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value)
}

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'username')
  const username = raw?.trim() ?? ''

  if (!isLikelyGitHubUsername(username)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid GitHub username',
    })
  }

  const { githubToken } = useRuntimeConfig(event)

  const headers: Record<string, string> = {
    'accept': 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  }

  if (githubToken)
    headers.Authorization = `Bearer ${githubToken}`

  const userUrl = `https://api.github.com/users/${encodeURIComponent(username)}`
  const reposUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&direction=desc`

  try {
    const [data, repos] = await Promise.all([
      $fetch<GitHubUserResponse>(userUrl, { headers }),
      $fetch<GitHubRepoListItem[]>(reposUrl, { headers }).catch(() => []),
    ])

    const topLanguages = computeTopLanguages(repos)

    return {
      login: data.login,
      name: data.name,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      profileUrl: data.html_url,
      blog: data.blog,
      location: data.location,
      company: data.company,
      twitterUsername: data.twitter_username,
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
      createdAt: data.created_at,
      topLanguages,
    }
  }
  catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'statusCode' in err
      ? Number((err as { statusCode?: number }).statusCode)
      : undefined

    if (status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'GitHub user not found',
      })
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to load profile from GitHub',
    })
  }
})
