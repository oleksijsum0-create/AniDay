'use client'

import { useQuery } from '@tanstack/react-query'
import { getSection } from './client'
import type { EnrichedRelease } from '@/types/release'

type SectionName = 'trending' | 'ongoing' | 'top-rated' | 'upcoming'

export function useSection(name: SectionName) {
  return useQuery<EnrichedRelease[]>({
    queryKey: ['sections', name],
    queryFn: () => getSection(name),
    staleTime: 5 * 60 * 1000,
  })
}
