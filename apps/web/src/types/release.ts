export interface ReleaseName {
  main: string
  english: string
  alternative: string
}

export interface ReleaseType {
  value: string
  description: string
}

export interface ReleasePoster {
  preview: string
  thumbnail: string
  optimized: {
    preview: string
    thumbnail: string
  }
}

export interface ReleaseGenre {
  id: number
  name: string
}

export interface ReleaseAgeRating {
  value: string
  label: string
  is_adult: boolean
  description: string
}

export interface ReleasePagination {
  total: number
  count: number
  per_page: number
  current_page: number
  total_pages: number
}

export interface ReleaseListResponse {
  data: Release[]
  meta: { pagination: ReleasePagination }
}

export interface Release {
  id: number
  type: ReleaseType
  year: number
  name: ReleaseName
  alias: string
  season: { value: string; description: string }
  poster: ReleasePoster
  fresh_at: string
  created_at: string
  updated_at: string
  is_ongoing: boolean
  age_rating: ReleaseAgeRating
  description: string
  notification: string
  episodes_total: number
  is_in_production: boolean
  is_blocked_by_geo: boolean
  is_blocked_by_copyrights: boolean
  genres: ReleaseGenre[]
  average_duration_of_episode: number
}

export interface Episode {
  id: number
  episode: number
  name: string
  created_at: string
  updated_at: string
}

export interface AnimeDetail extends Release {
  episodes?: Episode[]
}

export interface AnilistCover {
  extraLarge: string
  large: string
  medium: string
  color: string | null
}

export interface AnilistMeta {
  id: number
  title: { romaji: string; english: string; native: string }
  coverImage: AnilistCover
  averageScore: number | null
  genres: string[]
  episodes: number | null
  status: string
}

export interface EnrichedRelease extends Release {
  anilist?: AnilistMeta | null
}
