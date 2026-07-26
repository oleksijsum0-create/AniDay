import type { Env } from '../types'

const GRAPHQL_URL = 'https://graphql.anilist.co'

export async function anilistQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  env: Env,
  ttlSeconds = 86400,
): Promise<T> {
  const cacheKey = `anilist:${JSON.stringify({ query, variables })}`

  const cached = await env.CACHE.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  const remaining = response.headers.get('X-RateLimit-Remaining')
  const limit = response.headers.get('X-RateLimit-Limit')
  console.log(`AniList rate limit: ${remaining}/${limit}`)

  if (response.status === 429) {
    throw new Error('AniList rate limited')
  }

  const data: { errors?: unknown } = await response.json()
  if (data.errors) throw new Error(JSON.stringify(data.errors))

  await env.CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: ttlSeconds,
  })

  return data as T
}
