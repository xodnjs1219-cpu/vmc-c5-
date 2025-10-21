'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { SearchResponse } from '../lib/dto';

export const useSearchQuery = (query: string | null, enabled = true) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async (): Promise<SearchResponse> => {
      if (!query) {
        throw new Error('Query is required');
      }
      const { data } = await apiClient.get<SearchResponse>('/api/search', {
        params: { query },
      });
      return data;
    },
    enabled: enabled && !!query && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5분
  });
};
