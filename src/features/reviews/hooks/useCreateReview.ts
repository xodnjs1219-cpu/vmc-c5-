'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CreateReviewResponse } from '../lib/dto';

interface UseCreateReviewOptions {
  onSuccess?: (data: CreateReviewResponse) => void;
  onError?: (error: any) => void;
}

export const useCreateReview = (options?: UseCreateReviewOptions) => {
  return useMutation({
    mutationFn: async (data: {
      placeId: string;
      authorName: string;
      rating: number;
      content: string;
      password: string;
    }): Promise<CreateReviewResponse> => {
      const { data: response } = await apiClient.post<CreateReviewResponse>(
        '/api/reviews',
        data
      );
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
