'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

interface UseUpdateReviewOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useUpdateReview = (reviewId: string, options?: UseUpdateReviewOptions) => {
  return useMutation({
    mutationFn: async (data: {
      authorName: string;
      rating: number;
      content: string;
      password: string;
    }) => {
      const { data: response } = await apiClient.patch(`/api/reviews/${reviewId}`, {
        authorName: data.authorName,
        rating: data.rating,
        content: data.content,
        password: data.password,
      });
      return response;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};
