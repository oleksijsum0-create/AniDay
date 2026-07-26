const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787/api/v1'

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new ApiError(res.status, `API error: ${res.statusText}`)
  }

  return res.json()
}

export async function getReleases(page = 1, limit = 20) {
  return request<import('@/types/release').ReleaseListResponse>(
    `/releases?page=${page}&limit=${limit}`
  )
}

export async function getReleaseByAlias(alias: string) {
  return request<import('@/types/release').AnimeDetail>(`/releases/${alias}`)
}

export async function getLatestReleases() {
  return request<import('@/types/release').ReleaseListResponse>('/releases/latest')
}
