import { fetchAniliberty } from '../lib/aniliberty'
import { getAnilistId } from '../lib/d1'
import type { Env } from '../types'

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
  coverImage: { extraLarge: string; large: string; medium: string }
  averageScore: number
  genres: string[]
  description: string
  episodes: number
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
  const alias = url.pathname.replace('/api/v1/releases/', '')

  if (alias && alias !== 'releases') {
    return getReleaseDetail(alias, env)
  }

  const page = url.searchParams.get('page') ?? '1'
  const limit = url.searchParams.get('limit') ?? '20'

  const data = await fetchAniliberty<{
    data: AnilibertyRelease[]
    meta: { pagination: unknown }
  }>(`/anime/catalog/releases?page=${page}&limit=${limit}`, env)

  return jsonResponse(data)
}

async function getReleaseDetail(
  alias: string,
  env: Env,
): Promise<Response> {
  const release = await fetchAniliberty<{ data: AnilibertyRelease }>(
    `/anime/releases/${alias}`,
    env,
  )

  const enriched: EnrichedRelease = { ...release.data }

  const anilistId = await getAnilistId(release.data.id, env)
  if (anilistId) {
    try {
      const res = await fetch(`https://graphql.anilist.co`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query ($id: Int) {
            Media(id: $id, type: ANIME) {
              id title { romaji english native }
              coverImage { extraLarge large medium }
              averageScore genres description episodes status
            }
          }`,
          variables: { id: anilistId },
        }),
      })
      const anilistData: { data?: { Media: AnilistMedia | null } } = await res.json()
      enriched.anilist = anilistData.data?.Media ?? null
    } catch {
      enriched.anilist = null
    }
  }

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
