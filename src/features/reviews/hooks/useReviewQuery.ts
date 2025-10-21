'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export const useReviewQuery = (reviewId: string | null) => {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID required');
      const { data } = await apiClient.get(`/api/reviews/${reviewId}`);
      return data;
    },
    enabled: !!reviewId,
  });
};
