import type { Env } from '../types'

export interface TitleLink {
  aniliberty_id: number
  anilist_id: number | null
  mal_id: number | null
  confidence: number
  matched_at: string
  updated_at: string
  method: string
}

export async function getTitleLink(
  anilibertyId: number,
  env: Env,
): Promise<TitleLink | null> {
  return env.DB.prepare(
    'SELECT * FROM title_links WHERE aniliberty_id = ?',
  )
    .bind(anilibertyId)
    .first<TitleLink | null>()
}

export async function getAnilistId(
  anilibertyId: number,
  env: Env,
): Promise<number | null> {
  const link = await getTitleLink(anilibertyId, env)
  return link?.anilist_id ?? null
}
