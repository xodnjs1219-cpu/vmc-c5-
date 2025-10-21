import { SearchResponseSchema, SearchResultItemSchema } from '../backend/schema';

export type SearchResult = typeof SearchResultItemSchema._type;
export type SearchResponse = typeof SearchResponseSchema._type;
