import type { Env } from '../types'

const ANILIST_GRAPHQL = 'https://graphql.anilist.co'

export interface AnilibertyRelease {
  id: number
  alias: string
  name: { main: string; english: string; alternative: string }
  type: { value: string; description?: string }
  year: number
  poster: unknown
  genres: { id: number; name: string }[]
  episodes_total: number
  description: string
  is_ongoing: boolean
  fresh_at: string
  is_in_production: boolean
  season?: { value: string; description: string }
  age_rating?: { value: string; label: string; is_adult: boolean; description: string }
}

export interface AnilistMedia {
  id: number
  title: { romaji: string; english: string; native: string }
  coverImage: { extraLarge: string; large: string; medium: string; color: string | null }
  averageScore: number | null
  genres: string[]
  description: string
  episodes: number | null
  status: string
}

export interface EnrichedRelease extends AnilibertyRelease {
  anilist?: AnilistMedia | null
}

export async function getTitleLinks(ids: number[], env: Env) {
  if (ids.length === 0) return []
  const placeholders = ids.map(() => '?').join(',')
  return env.DB.prepare(
    `SELECT aniliberty_id, anilist_id FROM title_links WHERE aniliberty_id IN (${placeholders})`,
  )
    .bind(...ids)
    .all<{ aniliberty_id: number; anilist_id: number | null }>()
    .then(r => r.results ?? [])
}

export async function fetchAnilistBatch(ids: number[]): Promise<Map<number, AnilistMedia>> {
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

export function enrichReleases(
  releases: AnilibertyRelease[],
  links: { aniliberty_id: number; anilist_id: number | null }[],
  anilistMap: Map<number, AnilistMedia>,
): EnrichedRelease[] {
  return releases.map(r => {
    const link = links.find(l => l.aniliberty_id === r.id)
    const anilist = link?.anilist_id ? anilistMap.get(link.anilist_id) ?? null : null
    return { ...r, anilist }
  })
}

export async function enrichBatch(
  releases: AnilibertyRelease[],
  env: Env,
): Promise<EnrichedRelease[]> {
  const ids = releases.map(r => r.id)
  const links = await getTitleLinks(ids, env)
  const anilistIds = links.map(l => l.anilist_id).filter(Boolean) as number[]

  let anilistMap = new Map<number, AnilistMedia>()
  if (anilistIds.length > 0) {
    anilistMap = await fetchAnilistBatch(anilistIds)
  }

  return enrichReleases(releases, links, anilistMap)
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
