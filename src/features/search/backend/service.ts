import { createNaverSearchClient } from '@/lib/external/naver-client';
import { SearchQuerySchema, SearchResponseSchema } from './schema';
import { SEARCH_ERRORS, type SearchErrorCode } from './error';

export async function searchPlaces(
  query: string,
  config: { clientId: string; clientSecret: string }
) {
  // 쿼리 유효성 검증
  const queryValidation = SearchQuerySchema.safeParse(query);
  if (!queryValidation.success) {
    return {
      success: false,
      error: SEARCH_ERRORS.SEARCH_QUERY_INVALID,
      data: null,
    };
  }

  const validatedQuery = queryValidation.data;

  try {
    const client = createNaverSearchClient(config.clientId, config.clientSecret);
    const results = await client.search(validatedQuery, 5);

    if (results.length === 0) {
      return {
        success: true,
        error: null,
        data: {
          results: [],
          total: 0,
        },
      };
    }

    // 응답 스키마 검증
    const responseValidation = SearchResponseSchema.safeParse({
      results,
      total: results.length,
    });

    if (!responseValidation.success) {
      return {
        success: false,
        error: SEARCH_ERRORS.SEARCH_RESPONSE_INVALID,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: responseValidation.data,
    };
  } catch (error) {
    if (error instanceof Error) {
      const errorCode = error.message as SearchErrorCode;
      if (errorCode in SEARCH_ERRORS) {
        return {
          success: false,
          error: SEARCH_ERRORS[errorCode],
          data: null,
        };
      }
    }

    return {
      success: false,
      error: SEARCH_ERRORS.SEARCH_API_ERROR,
      data: null,
    };
  }
}
