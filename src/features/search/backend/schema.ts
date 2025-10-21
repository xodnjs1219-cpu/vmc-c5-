import { z } from 'zod';

export const SearchQuerySchema = z
  .string()
  .min(2, '검색어는 최소 2자 이상이어야 합니다')
  .max(50, '검색어는 최대 50자 이하여야 합니다')
  .trim();

export const SearchResultItemSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  category: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  link: z.string(),
});

export const SearchResponseSchema = z.object({
  results: z.array(SearchResultItemSchema),
  total: z.number(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
