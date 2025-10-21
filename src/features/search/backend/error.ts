/**
 * 검색 기능 관련 에러 코드 정의
 */
export const SEARCH_ERRORS = {
  SEARCH_QUERY_REQUIRED: {
    code: 'SEARCH_QUERY_REQUIRED',
    message: '검색 키워드가 필요합니다',
    statusCode: 400,
  },
  SEARCH_QUERY_INVALID: {
    code: 'SEARCH_QUERY_INVALID',
    message: '검색 키워드가 유효하지 않습니다',
    statusCode: 400,
  },
  SEARCH_API_ERROR: {
    code: 'SEARCH_API_ERROR',
    message: '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
    statusCode: 500,
  },
  SEARCH_AUTH_ERROR: {
    code: 'SEARCH_AUTH_ERROR',
    message: '네이버 API 인증 오류가 발생했습니다. 관리자에게 문의하세요',
    statusCode: 500,
  },
  SEARCH_TIMEOUT_ERROR: {
    code: 'SEARCH_TIMEOUT_ERROR',
    message: '요청 시간이 초과되었습니다',
    statusCode: 504,
  },
  SEARCH_RESPONSE_INVALID: {
    code: 'SEARCH_RESPONSE_INVALID',
    message: '검색 결과 형식이 올바르지 않습니다',
    statusCode: 500,
  },
} as const;

export type SearchErrorCode = keyof typeof SEARCH_ERRORS;
