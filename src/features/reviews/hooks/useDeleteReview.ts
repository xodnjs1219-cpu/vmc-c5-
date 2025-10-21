'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

interface UseDeleteReviewOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useDeleteReview = (reviewId: string, options?: UseDeleteReviewOptions) => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete(`/api/reviews/${reviewId}`);
      return data;
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};
