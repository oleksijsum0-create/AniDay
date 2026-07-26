'use client'

import { useQuery } from '@tanstack/react-query'
import { getLatestReleases } from './client'
import type { EnrichedRelease } from '@/types/release'

export function useLatestReleases() {
  return useQuery<EnrichedRelease[]>({
    queryKey: ['releases', 'latest'],
    queryFn: getLatestReleases,
    staleTime: 5 * 60 * 1000,
  })
}
