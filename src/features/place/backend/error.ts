/**
 * 장소 조회 기능 관련 에러 코드 정의
 */
export const PLACE_ERRORS = {
  PLACE_ID_REQUIRED: {
    code: 'PLACE_ID_REQUIRED',
    message: '장소 ID가 필요합니다',
    statusCode: 400,
  },
  PLACE_ID_INVALID: {
    code: 'PLACE_ID_INVALID',
    message: '장소 ID 형식이 올바르지 않습니다',
    statusCode: 400,
  },
  PLACE_NOT_FOUND: {
    code: 'PLACE_NOT_FOUND',
    message: '해당 장소를 찾을 수 없습니다',
    statusCode: 404,
  },
  PLACE_FETCH_ERROR: {
    code: 'PLACE_FETCH_ERROR',
    message: '장소 정보 조회 중 오류가 발생했습니다',
    statusCode: 500,
  },
  REVIEWS_FETCH_ERROR: {
    code: 'REVIEWS_FETCH_ERROR',
    message: '리뷰 목록 조회 중 오류가 발생했습니다',
    statusCode: 500,
  },
} as const;

export type PlaceErrorCode = keyof typeof PLACE_ERRORS;
