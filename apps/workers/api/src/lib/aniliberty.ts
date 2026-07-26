import type { Env } from '../types'

const BASE = 'https://aniliberty.top/api/v1'

export async function fetchAniliberty<T>(
  path: string,
  env: Env,
  ttlSeconds = 3600,
): Promise<T> {
  const cacheKey = `aniliberty:${path}`

  const cached = await env.CACHE.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const url = `${BASE}${path}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (response.status === 429) {
    throw new Error('AniLiberty rate limited')
  }

  if (!response.ok) {
    throw new Error(`AniLiberty error: ${response.status}`)
  }

  const data: T = await response.json()

  await env.CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: ttlSeconds,
  })

  return data
}
