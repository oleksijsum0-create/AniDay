import { fetchAniliberty } from '../lib/aniliberty'
import type { Env } from '../types'

const ANILIST_GRAPHQL = 'https://graphql.anilist.co'
const LATEST_TTL = 3600
const DETAIL_TTL = 86400

interface AnilibertyRelease {
  id: number
  alias: string
  name: { main: string; english: string; alternative: string }
  type: { value: string }
  year: number
  poster: unknown
  genres: { id: number; name: string }[]
  episodes_total: number
  description: string
  is_ongoing: boolean
}

interface AnilistMedia {
  id: number
  title: { romaji: string; english: string; native: string }
  coverImage: { extraLarge: string; large: string; medium: string; color: string | null }
  averageScore: number | null
  genres: string[]
  description: string
  episodes: number | null
  status: string
}

interface EnrichedRelease extends AnilibertyRelease {
  anilist?: AnilistMedia | null
}

export async function releasesHandler(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === '/api/v1/releases/latest') return latestReleasesHandler(env)

  const alias = path.replace('/api/v1/releases/', '')
  if (alias && alias !== 'releases') return getReleaseDetail(alias, env)

  const page = url.searchParams.get('page') ?? '1'
  const limit = url.searchParams.get('limit') ?? '20'

  const data = await fetchAniliberty<{
    data: AnilibertyRelease[]
    meta: { pagination: unknown }
  }>(`/anime/catalog/releases?page=${page}&limit=${limit}`, env)

  return jsonResponse(data)
}

async function latestReleasesHandler(env: Env): Promise<Response> {
  const cacheKey = 'aniday:latest-enriched'

  const cached = await env.CACHE.get(cacheKey)
  if (cached) return jsonResponse(JSON.parse(cached))

  const releases = await fetchAniliberty<AnilibertyRelease[]>(
    '/anime/releases/latest?limit=30',
    env,
    LATEST_TTL,
  )

  const ids = releases.map(r => r.id)
  const links = await getTitleLinks(ids, env)
  const anilistIds = links.map(l => l.anilist_id).filter(Boolean) as number[]

  let anilistMap = new Map<number, AnilistMedia>()
  if (anilistIds.length > 0) {
    anilistMap = await fetchAnilistBatch(anilistIds)
  }

  const enriched: EnrichedRelease[] = releases.map(r => {
    const link = links.find(l => l.aniliberty_id === r.id)
    const anilist = link?.anilist_id ? anilistMap.get(link.anilist_id) ?? null : null
    return { ...r, anilist }
  })

  await env.CACHE.put(cacheKey, JSON.stringify(enriched), {
    expirationTtl: LATEST_TTL,
  })

  return jsonResponse(enriched)
}

async function getTitleLinks(ids: number[], env: Env) {
  if (ids.length === 0) return []
  const placeholders = ids.map(() => '?').join(',')
  return env.DB.prepare(
    `SELECT aniliberty_id, anilist_id FROM title_links WHERE aniliberty_id IN (${placeholders})`,
  )
    .bind(...ids)
    .all<{ aniliberty_id: number; anilist_id: number | null }>()
    .then(r => r.results ?? [])
}

async function fetchAnilistBatch(ids: number[]): Promise<Map<number, AnilistMedia>> {
  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids, type: ANIME) {
          id
          title { romaji english native }
          coverImage { extraLarge large medium color }
          averageScore
          genres
          description
          episodes
          status
        }
      }
    }
  `

  try {
    const res = await fetch(ANILIST_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { ids } }),
    })

    if (!res.ok) return new Map()

    const data: { data?: { Page?: { media: AnilistMedia[] } } } = await res.json()
    const map = new Map<number, AnilistMedia>()
    for (const m of data.data?.Page?.media ?? []) {
      map.set(m.id, m)
    }
    return map
  } catch {
    return new Map()
  }
}

async function getReleaseDetail(
  alias: string,
  env: Env,
): Promise<Response> {
  const cacheKey = `aniday:detail:${alias}`
  const cached = await env.CACHE.get(cacheKey)
  if (cached) return jsonResponse(JSON.parse(cached))

  const release = await fetchAniliberty<{ data: AnilibertyRelease }>(
    `/anime/releases/${alias}`,
    env,
  )

  const enriched: EnrichedRelease = { ...release.data }

  const link = await getTitleLinks([release.data.id], env).then(r => r[0])
  if (link?.anilist_id) {
    const map = await fetchAnilistBatch([link.anilist_id])
    enriched.anilist = map.get(link.anilist_id) ?? null
  }

  await env.CACHE.put(cacheKey, JSON.stringify({ data: enriched }), {
    expirationTtl: DETAIL_TTL,
  })

  return jsonResponse({ data: enriched })
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
