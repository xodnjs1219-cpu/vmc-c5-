/**
 * 리뷰 기능 관련 에러 코드 정의
 */
export const REVIEW_ERRORS = {
  INVALID_REVIEW_DATA: {
    code: 'INVALID_REVIEW_DATA',
    message: '리뷰 데이터가 유효하지 않습니다',
    statusCode: 400,
  },
  PLACE_NOT_FOUND: {
    code: 'PLACE_NOT_FOUND',
    message: '해당 장소를 찾을 수 없습니다',
    statusCode: 404,
  },
  REVIEW_CREATE_ERROR: {
    code: 'REVIEW_CREATE_ERROR',
    message: '리뷰 작성 중 오류가 발생했습니다',
    statusCode: 500,
  },
  PASSWORD_HASH_ERROR: {
    code: 'PASSWORD_HASH_ERROR',
    message: '비밀번호 처리 중 오류가 발생했습니다',
    statusCode: 500,
  },
  PLACE_UPDATE_ERROR: {
    code: 'PLACE_UPDATE_ERROR',
    message: '장소 정보 업데이트 중 오류가 발생했습니다',
    statusCode: 500,
  },
  REVIEW_NOT_FOUND: {
    code: 'REVIEW_NOT_FOUND',
    message: '해당 리뷰를 찾을 수 없습니다',
    statusCode: 404,
  },
  INVALID_PASSWORD: {
    code: 'INVALID_PASSWORD',
    message: '비밀번호가 일치하지 않습니다',
    statusCode: 401,
  },
} as const;

export type ReviewErrorCode = keyof typeof REVIEW_ERRORS;
