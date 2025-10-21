'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

interface UseVerifyPasswordOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useVerifyPassword = (reviewId: string, options?: UseVerifyPasswordOptions) => {
  return useMutation({
    mutationFn: async (password: string) => {
      const { data } = await apiClient.post(`/api/reviews/${reviewId}/verify`, {
        password,
      });
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
