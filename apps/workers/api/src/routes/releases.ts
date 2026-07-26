import { fetchAniliberty } from '../lib/aniliberty'
import {
  enrichBatch,
  getTitleLinks,
  fetchAnilistBatch,
  jsonResponse,
  type AnilibertyRelease,
  type AnilistMedia,
  type EnrichedRelease,
} from '../lib/enrich'
import type { Env } from '../types'

const LATEST_TTL = 3600
const DETAIL_TTL = 86400

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

  const enriched = await enrichBatch(releases, env)

  await env.CACHE.put(cacheKey, JSON.stringify(enriched), {
    expirationTtl: LATEST_TTL,
  })

  return jsonResponse(enriched)
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
