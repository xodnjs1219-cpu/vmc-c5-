import { z } from 'zod';

export const PlaceParamsSchema = z.object({
  placeId: z.string().uuid(),
});

export const ReviewItemSchema = z.object({
  id: z.string().uuid(),
  authorName: z.string(),
  rating: z.number(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PlaceDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  category: z.string(),
  averageRating: z.number(),
  reviewCount: z.number(),
});

export const PlaceDetailResponseSchema = z.object({
  place: PlaceDetailSchema,
  reviews: z.array(ReviewItemSchema),
});

export type PlaceParams = z.infer<typeof PlaceParamsSchema>;
export type ReviewItem = z.infer<typeof ReviewItemSchema>;
export type PlaceDetail = z.infer<typeof PlaceDetailSchema>;
export type PlaceDetailResponse = z.infer<typeof PlaceDetailResponseSchema>;
