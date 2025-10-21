'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { PlaceDetailResponse } from '../lib/dto';

export const usePlaceDetailQuery = (placeId: string | null) => {
  return useQuery({
    queryKey: ['place-detail', placeId],
    queryFn: async (): Promise<PlaceDetailResponse> => {
      if (!placeId) {
        throw new Error('Place ID is required');
      }
      const { data } = await apiClient.get<PlaceDetailResponse>(
        `/api/places/${placeId}`
      );
      return data;
    },
    enabled: !!placeId,
  });
};
