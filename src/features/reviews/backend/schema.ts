import { z } from 'zod';

export const CreateReviewRequestSchema = z.object({
  authorName: z
    .string()
    .min(1, '작성자명을 입력하세요')
    .max(50, '작성자명은 최대 50자입니다'),
  rating: z
    .number()
    .int()
    .min(1, '평점을 선택하세요')
    .max(5, '평점은 1~5 사이입니다'),
  content: z
    .string()
    .min(1, '리뷰 내용을 입력하세요')
    .max(1000, '리뷰는 최대 1000자입니다'),
  password: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(100, '비밀번호는 최대 100자입니다'),
});

export const PlaceInfoSchema = z.object({
  name: z.string(),
  address: z.string(),
  category: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export const ReviewTableRowSchema = z.object({
  id: z.string().uuid(),
  place_id: z.string().uuid(),
  author_name: z.string(),
  rating: z.number(),
  content: z.string(),
  password_hash: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const PlaceTableRowSchema = z.object({
  id: z.string().uuid(),
  external_id: z.string().optional(),
  name: z.string(),
  address: z.string(),
  category: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  average_rating: z.number().default(0),
  review_count: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateReviewResponseSchema = z.object({
  id: z.string().uuid(),
  placeId: z.string().uuid(),
  authorName: z.string(),
  rating: z.number(),
  content: z.string(),
  createdAt: z.string(),
});

export type CreateReviewRequest = z.infer<typeof CreateReviewRequestSchema>;
export type PlaceInfo = z.infer<typeof PlaceInfoSchema>;
export type ReviewTableRow = z.infer<typeof ReviewTableRowSchema>;
export type PlaceTableRow = z.infer<typeof PlaceTableRowSchema>;
export type CreateReviewResponse = z.infer<typeof CreateReviewResponseSchema>;
