# Use Case 002 구현 계획: 신규 리뷰 작성 및 저장

## 개요

본 문서는 Use Case 002 (신규 리뷰 작성 및 저장 기능)을 구현하기 위한 모듈 설계 및 구현 계획입니다. 사용자가 특정 장소에 대한 리뷰를 작성하고, 비밀번호 기반의 익명 리뷰를 데이터베이스에 저장하며, 장소의 평균 평점과 리뷰 개수를 자동으로 갱신하는 기능을 포함합니다.

### 주요 특징
- **비밀번호 해싱**: bcrypt를 사용한 안전한 비밀번호 해시 처리
- **트랜잭션 처리**: 리뷰 저장 및 장소 정보 갱신을 원자적으로 처리
- **자동 평점 계산**: 리뷰 저장 시 장소의 평균 평점과 리뷰 개수 자동 갱신
- **폼 검증**: react-hook-form + zod를 활용한 클라이언트/서버 양쪽 유효성 검증
- **에러 핸들링**: 상세한 에러 코드 및 사용자 친화적인 메시지 제공

---

## 모듈 목록

### Backend 모듈

#### 1. `/src/lib/hash/password.ts`
- **설명**: bcrypt를 사용한 비밀번호 해싱 유틸리티
- **역할**:
  - 비밀번호 해시 생성 (`hashPassword`)
  - 비밀번호 검증 (`verifyPassword`)
  - 에러 처리

#### 2. `/src/features/reviews/backend/schema.ts`
- **설명**: 리뷰 작성 요청/응답 스키마 정의 (Zod)
- **역할**:
  - `CreateReviewRequestSchema`: 리뷰 생성 요청 검증
  - `CreateReviewResponseSchema`: 리뷰 생성 응답 스키마
  - `ReviewTableRowSchema`: DB 리뷰 테이블 row 스키마
  - `PlaceTableRowSchema`: DB 장소 테이블 row 스키마 (부분)

#### 3. `/src/features/reviews/backend/error.ts`
- **설명**: 리뷰 기능 관련 에러 코드 정의
- **역할**:
  - `INVALID_REVIEW_DATA`: 요청 데이터 유효성 검증 실패
  - `PLACE_NOT_FOUND`: 장소가 존재하지 않음
  - `REVIEW_CREATE_ERROR`: 리뷰 생성 실패
  - `PASSWORD_HASH_ERROR`: 비밀번호 해시 처리 실패
  - `PLACE_UPDATE_ERROR`: 장소 정보 갱신 실패

#### 4. `/src/features/reviews/backend/service.ts`
- **설명**: 리뷰 생성 비즈니스 로직 처리
- **역할**:
  - `createReview()`: 리뷰 생성 및 장소 정보 갱신 (트랜잭션)
  - `verifyPlaceExists()`: 장소 존재 확인
  - `updatePlaceStats()`: 장소 통계 갱신 (평균 평점, 리뷰 개수)
  - 에러 핸들링 및 검증

#### 5. `/src/features/reviews/backend/route.ts`
- **설명**: Hono 기반 리뷰 API 라우터
- **역할**:
  - `POST /api/reviews` 엔드포인트 정의
  - 요청 바디 검증
  - Service 호출 및 응답 반환
  - 에러 로깅

### Frontend 모듈

#### 6. `/src/features/reviews/lib/dto.ts`
- **설명**: 백엔드 스키마 재노출 (프론트엔드용)
- **역할**:
  - `CreateReviewRequest`, `CreateReviewResponse` 타입 재노출
  - React Query 훅에서 사용

#### 7. `/src/features/reviews/hooks/useCreateReview.ts`
- **설명**: 리뷰 생성 API 호출 React Query Mutation 훅
- **역할**:
  - `useCreateReview()` 훅 제공
  - API 호출 및 낙관적 업데이트
  - 에러 처리
  - 성공 시 콜백 실행

#### 8. `/src/features/reviews/components/review-form.tsx`
- **설명**: 리뷰 작성 폼 컴포넌트
- **역할**:
  - react-hook-form 기반 폼 구현
  - 작성자명, 평점, 내용, 비밀번호 입력 필드
  - 실시간 유효성 검증 및 에러 메시지 표시
  - 저장 버튼 및 로딩 상태 관리

#### 9. `/src/features/reviews/components/rating-input.tsx`
- **설명**: 별점 입력 컴포넌트
- **역할**:
  - 1~5점 선택 가능한 별 아이콘 UI
  - 마우스 호버 효과
  - 접근성 (키보드 네비게이션)

#### 10. `/src/features/reviews/components/place-info-card.tsx`
- **설명**: 장소 정보 표시 카드 컴포넌트
- **역할**:
  - 장소명, 주소, 업종 표시
  - 리뷰 작성 페이지 상단에 배치

### 페이지 모듈

#### 11. `/src/app/write/page.tsx`
- **설명**: 리뷰 작성 페이지 (Client Component)
- **역할**:
  - 쿼리 파라미터에서 placeId 추출
  - PlaceInfoCard 및 ReviewForm 컴포넌트 배치
  - 리뷰 저장 성공 시 `/place/[placeId]` 로 리다이렉트
  - 에러 처리 (잘못된 placeId 등)

### 통합 모듈

#### 12. `/src/backend/hono/app.ts` (수정)
- **설명**: Hono 앱에 리뷰 라우터 등록
- **역할**:
  - `registerReviewRoutes(app)` 호출 추가

---

## 모듈 관계 다이어그램

```mermaid
graph TB
    subgraph "Frontend - Page"
        A[/write/page.tsx]
    end

    subgraph "Frontend - Components"
        B[ReviewForm Component]
        C[RatingInput Component]
        D[PlaceInfoCard Component]
    end

    subgraph "Frontend - Hooks"
        E[useCreateReview Hook]
        F[dto.ts - Type Exports]
    end

    subgraph "API Client"
        G[api-client.ts - Axios Instance]
    end

    subgraph "Backend - Hono Routes"
        H[route.ts - POST /api/reviews]
    end

    subgraph "Backend - Business Logic"
        I[service.ts - createReview]
        J[schema.ts - Zod Schemas]
        K[error.ts - Error Codes]
    end

    subgraph "Backend - Utilities"
        L[password.ts - bcrypt Hash/Verify]
    end

    subgraph "Database"
        M[(Supabase - reviews)]
        N[(Supabase - places)]
    end

    subgraph "Shared Backend"
        O[response.ts - success/failure/respond]
        P[context.ts - AppEnv/Logger/Supabase]
    end

    A -->|장소 정보 표시| D
    A -->|폼 렌더링| B
    B -->|별점 선택| C
    B -->|폼 제출| E

    E -->|HTTP POST| G
    G -->|/api/reviews| H

    H -->|요청 검증| J
    H -->|서비스 호출| I
    H -->|응답 반환| O

    I -->|비밀번호 해싱| L
    I -->|장소 존재 확인| N
    I -->|리뷰 INSERT| M
    I -->|장소 통계 갱신| N
    I -->|에러 처리| K

    L -.bcrypt 해싱.-> L

    E -->|응답 파싱| F
    E -->|성공 시 리다이렉트| A

    H -.로깅.-> P
    I -.트랜잭션.-> P
    I -.성공/실패 반환.-> O

    style M fill:#e1f5ff,stroke:#0288d1
    style N fill:#e1f5ff,stroke:#0288d1
    style L fill:#fff9c4,stroke:#f57f17
    style H fill:#c8e6c9,stroke:#388e3c
    style I fill:#c8e6c9,stroke:#388e3c
```

---

## 구현 계획

### Phase 1: 비밀번호 해싱 유틸리티 구현

#### 1.1. `/src/lib/hash/password.ts`

**목적**: bcrypt를 사용한 안전한 비밀번호 해시 처리 유틸리티

**구현 내용**:
```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * 비밀번호 해시 에러
 */
export class PasswordHashError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'PasswordHashError';
  }
}

/**
 * 비밀번호를 bcrypt로 해시 처리
 * @param password 원본 비밀번호
 * @returns 해시된 비밀번호
 * @throws {PasswordHashError} 해싱 실패 시
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new PasswordHashError('Failed to hash password', error);
  }
};

/**
 * 비밀번호 검증
 * @param password 입력된 비밀번호
 * @param hash 저장된 해시값
 * @returns 일치 여부
 * @throws {PasswordHashError} 검증 실패 시
 */
export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    throw new PasswordHashError('Failed to verify password', error);
  }
};
```

**필요한 패키지 설치**:
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

**단위 테스트 시나리오** (`password.test.ts`):
- ✅ 정상 비밀번호 해싱 및 검증 성공
- ✅ 동일한 비밀번호로 여러 번 해싱 시 다른 해시값 생성
- ✅ 잘못된 비밀번호로 검증 시 false 반환
- ✅ 해싱 실패 시 `PasswordHashError` 발생

---

### Phase 2: Backend 모듈 구현

#### 2.1. `/src/features/reviews/backend/schema.ts`

```typescript
import { z } from 'zod';

// 리뷰 생성 요청 스키마
export const CreateReviewRequestSchema = z.object({
  placeId: z
    .string()
    .uuid({ message: 'placeId는 유효한 UUID여야 합니다.' }),
  authorName: z
    .string()
    .min(1, { message: '작성자명을 입력하세요.' })
    .max(50, { message: '작성자명은 최대 50자까지 입력 가능합니다.' }),
  rating: z
    .number()
    .int({ message: '평점은 정수여야 합니다.' })
    .min(1, { message: '평점은 최소 1점입니다.' })
    .max(5, { message: '평점은 최대 5점입니다.' }),
  content: z
    .string()
    .min(1, { message: '리뷰 내용을 입력하세요.' })
    .max(1000, { message: '리뷰 내용은 최대 1000자까지 입력 가능합니다.' }),
  password: z
    .string()
    .min(4, { message: '비밀번호는 최소 4자 이상이어야 합니다.' })
    .max(100, { message: '비밀번호는 최대 100자까지 입력 가능합니다.' }),
});

export type CreateReviewRequest = z.infer<typeof CreateReviewRequestSchema>;

// 리뷰 생성 응답 스키마
export const CreateReviewResponseSchema = z.object({
  reviewId: z.string().uuid(),
  placeId: z.string().uuid(),
  authorName: z.string(),
  rating: z.number().int().min(1).max(5),
  content: z.string(),
  createdAt: z.string(), // ISO 8601 timestamp
});

export type CreateReviewResponse = z.infer<typeof CreateReviewResponseSchema>;

// DB 리뷰 테이블 row 스키마
export const ReviewTableRowSchema = z.object({
  id: z.string().uuid(),
  place_id: z.string().uuid(),
  author_name: z.string(),
  rating: z.number().int(),
  content: z.string(),
  password_hash: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ReviewRow = z.infer<typeof ReviewTableRowSchema>;

// DB 장소 테이블 row 스키마 (부분)
export const PlaceTableRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  category: z.string().nullable(),
});

export type PlaceRow = z.infer<typeof PlaceTableRowSchema>;
```

#### 2.2. `/src/features/reviews/backend/error.ts`

```typescript
export const reviewErrorCodes = {
  invalidReviewData: 'INVALID_REVIEW_DATA',
  placeNotFound: 'PLACE_NOT_FOUND',
  reviewCreateError: 'REVIEW_CREATE_ERROR',
  passwordHashError: 'PASSWORD_HASH_ERROR',
  placeUpdateError: 'PLACE_UPDATE_ERROR',
} as const;

type ReviewErrorValue = (typeof reviewErrorCodes)[keyof typeof reviewErrorCodes];

export type ReviewServiceError = ReviewErrorValue;
```

#### 2.3. `/src/features/reviews/backend/service.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  hashPassword,
  PasswordHashError,
} from '@/lib/hash/password';
import {
  CreateReviewResponseSchema,
  PlaceTableRowSchema,
  ReviewTableRowSchema,
  type CreateReviewRequest,
  type CreateReviewResponse,
  type PlaceRow,
  type ReviewRow,
} from '@/features/reviews/backend/schema';
import {
  reviewErrorCodes,
  type ReviewServiceError,
} from '@/features/reviews/backend/error';

const REVIEWS_TABLE = 'reviews';
const PLACES_TABLE = 'places';

/**
 * 장소 존재 확인
 */
const verifyPlaceExists = async (
  client: SupabaseClient,
  placeId: string,
): Promise<HandlerResult<PlaceRow, ReviewServiceError, unknown>> => {
  const { data, error } = await client
    .from(PLACES_TABLE)
    .select('id, name, address, category')
    .eq('id', placeId)
    .maybeSingle<PlaceRow>();

  if (error) {
    return failure(
      500,
      reviewErrorCodes.reviewCreateError,
      '장소 조회 중 오류가 발생했습니다.',
      error,
    );
  }

  if (!data) {
    return failure(
      404,
      reviewErrorCodes.placeNotFound,
      '지정된 장소가 존재하지 않습니다.',
    );
  }

  const parsed = PlaceTableRowSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      reviewErrorCodes.reviewCreateError,
      '장소 데이터 검증 실패',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

/**
 * 리뷰 생성 및 장소 통계 갱신 (트랜잭션)
 */
export const createReview = async (
  client: SupabaseClient,
  request: CreateReviewRequest,
): Promise<HandlerResult<CreateReviewResponse, ReviewServiceError, unknown>> => {
  // 1. 장소 존재 확인
  const placeResult = await verifyPlaceExists(client, request.placeId);

  if (!placeResult.ok) {
    return placeResult as HandlerResult<CreateReviewResponse, ReviewServiceError, unknown>;
  }

  // 2. 비밀번호 해시 처리
  let passwordHash: string;

  try {
    passwordHash = await hashPassword(request.password);
  } catch (error) {
    if (error instanceof PasswordHashError) {
      return failure(
        500,
        reviewErrorCodes.passwordHashError,
        '비밀번호 해시 처리 중 오류가 발생했습니다.',
        error.originalError,
      );
    }

    return failure(
      500,
      reviewErrorCodes.passwordHashError,
      '비밀번호 처리 중 예상치 못한 오류가 발생했습니다.',
      error instanceof Error ? error.message : String(error),
    );
  }

  // 3. 리뷰 INSERT
  const { data: reviewData, error: reviewError } = await client
    .from(REVIEWS_TABLE)
    .insert({
      place_id: request.placeId,
      author_name: request.authorName,
      rating: request.rating,
      content: request.content,
      password_hash: passwordHash,
    })
    .select('id, place_id, author_name, rating, content, created_at')
    .single<Partial<ReviewRow>>();

  if (reviewError || !reviewData) {
    return failure(
      500,
      reviewErrorCodes.reviewCreateError,
      '리뷰 저장 중 오류가 발생했습니다.',
      reviewError,
    );
  }

  // 4. 장소 통계 갱신 (평균 평점, 리뷰 개수)
  const { error: updateError } = await client.rpc('update_place_stats', {
    p_place_id: request.placeId,
  });

  if (updateError) {
    // 리뷰는 이미 저장되었으므로, 로깅만 하고 성공 응답 반환
    console.error('Failed to update place stats:', updateError);
  }

  // 5. 응답 데이터 구성
  const response: CreateReviewResponse = {
    reviewId: reviewData.id!,
    placeId: reviewData.place_id!,
    authorName: reviewData.author_name!,
    rating: reviewData.rating!,
    content: reviewData.content!,
    createdAt: reviewData.created_at!,
  };

  const parsed = CreateReviewResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      reviewErrorCodes.reviewCreateError,
      '응답 데이터 검증 실패',
      parsed.error.format(),
    );
  }

  return success(parsed.data, 201);
};
```

**주의사항**:
- 장소 통계 갱신은 PostgreSQL Function (`update_place_stats`)을 사용하여 처리합니다.
- 이 함수는 별도 마이그레이션 파일에서 생성됩니다 (Phase 2.5 참조).
- 트랜잭션 대신 RPC를 사용하여 평균 평점과 리뷰 개수를 원자적으로 갱신합니다.

#### 2.4. `/src/features/reviews/backend/route.ts`

```typescript
import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { CreateReviewRequestSchema } from '@/features/reviews/backend/schema';
import { createReview } from './service';
import {
  reviewErrorCodes,
  type ReviewServiceError,
} from './error';

export const registerReviewRoutes = (app: Hono<AppEnv>) => {
  app.post('/reviews', async (c) => {
    const body = await c.req.json();

    // 요청 바디 검증
    const parsedBody = CreateReviewRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          reviewErrorCodes.invalidReviewData,
          '요청 데이터가 유효하지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createReview(supabase, parsedBody.data);

    // 에러 로깅
    if (!result.ok) {
      const errorResult = result as ErrorResult<ReviewServiceError, unknown>;

      if (
        errorResult.error.code === reviewErrorCodes.reviewCreateError ||
        errorResult.error.code === reviewErrorCodes.passwordHashError ||
        errorResult.error.code === reviewErrorCodes.placeUpdateError
      ) {
        logger.error('Review creation error', errorResult.error);
      } else if (errorResult.error.code === reviewErrorCodes.placeNotFound) {
        logger.warn('Place not found', { placeId: parsedBody.data.placeId });
      }
    } else {
      logger.info('Review created successfully', {
        reviewId: result.data.reviewId,
        placeId: result.data.placeId,
      });
    }

    return respond(c, result);
  });
};
```

#### 2.5. PostgreSQL Function 생성 (마이그레이션)

**파일명**: `/supabase/migrations/0006_create_update_place_stats_function.sql`

```sql
-- Migration: Create update_place_stats function
-- Description: 장소의 평균 평점과 리뷰 개수를 자동으로 갱신하는 함수
-- Created: 2025-10-21

BEGIN;

-- 장소 통계 갱신 함수
CREATE OR REPLACE FUNCTION update_place_stats(p_place_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE places
  SET
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE place_id = p_place_id
    ),
    average_rating = COALESCE(
      (
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM reviews
        WHERE place_id = p_place_id
      ),
      0.0
    )
  WHERE id = p_place_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Rollback script (참고용)
-- DROP FUNCTION IF EXISTS update_place_stats(UUID);
```

**단위 테스트 시나리오** (`service.test.ts`):
- ✅ 정상 리뷰 생성 및 장소 통계 갱신 (201 Created)
- ✅ 존재하지 않는 placeId로 요청 시 404 `PLACE_NOT_FOUND`
- ✅ 비밀번호 해싱 실패 시 500 `PASSWORD_HASH_ERROR`
- ✅ 리뷰 INSERT 실패 시 500 `REVIEW_CREATE_ERROR`
- ✅ 장소 통계 갱신 실패 시에도 리뷰는 저장되고 성공 응답 반환

#### 2.6. `/src/backend/hono/app.ts` 수정

```typescript
import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerSearchRoutes } from '@/features/search/backend/route';
import { registerReviewRoutes } from '@/features/reviews/backend/route'; // 추가
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerSearchRoutes(app);
  registerReviewRoutes(app); // 추가

  singletonApp = app;

  return app;
};
```

---

### Phase 3: Frontend 모듈 구현

#### 3.1. `/src/features/reviews/lib/dto.ts`

```typescript
export {
  CreateReviewRequestSchema,
  CreateReviewResponseSchema,
  type CreateReviewRequest,
  type CreateReviewResponse,
} from '@/features/reviews/backend/schema';
```

#### 3.2. `/src/features/reviews/hooks/useCreateReview.ts`

```typescript
'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  CreateReviewResponseSchema,
  type CreateReviewRequest,
  type CreateReviewResponse,
} from '@/features/reviews/lib/dto';

const postReview = async (
  request: CreateReviewRequest,
): Promise<CreateReviewResponse> => {
  try {
    const { data } = await apiClient.post('/api/reviews', request);

    // 응답 스키마 검증
    const parsed = CreateReviewResponseSchema.parse(data);
    return parsed;
  } catch (error) {
    const message = extractApiErrorMessage(
      error,
      '리뷰 저장 중 오류가 발생했습니다.',
    );
    throw new Error(message);
  }
};

interface UseCreateReviewOptions {
  onSuccess?: (data: CreateReviewResponse) => void;
  onError?: (error: Error) => void;
}

export const useCreateReview = (
  options?: UseCreateReviewOptions,
): UseMutationResult<CreateReviewResponse, Error, CreateReviewRequest> => {
  return useMutation({
    mutationFn: postReview,
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};
```

#### 3.3. `/src/features/reviews/components/rating-input.tsx`

```typescript
'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export const RatingInput = ({ value, onChange, disabled = false }: RatingInputProps) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const displayRating = hoverRating ?? value;

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="평점 선택">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => handleClick(rating)}
          onMouseEnter={() => !disabled && setHoverRating(rating)}
          onMouseLeave={() => setHoverRating(null)}
          disabled={disabled}
          className={cn(
            'focus:outline-none focus:ring-2 focus:ring-primary rounded',
            disabled && 'cursor-not-allowed opacity-50',
          )}
          aria-label={`${rating}점`}
          role="radio"
          aria-checked={value === rating}
        >
          <Star
            className={cn(
              'h-8 w-8 transition-colors',
              displayRating >= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300',
            )}
          />
        </button>
      ))}
    </div>
  );
};
```

**QA Sheet** (`rating-input.qa.md`):
- ✅ 별 아이콘 클릭 시 해당 평점 선택
- ✅ 마우스 호버 시 호버된 별까지 하이라이트
- ✅ 선택된 평점은 노란색으로 채워짐
- ✅ `disabled` 상태에서 클릭 및 호버 불가
- ✅ 키보드 네비게이션 지원 (Tab, Enter)
- ✅ `aria-label` 및 `role="radiogroup"` 으로 접근성 지원

#### 3.4. `/src/features/reviews/components/place-info-card.tsx`

```typescript
'use client';

import { MapPin, Tag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface PlaceInfoCardProps {
  name: string;
  address: string;
  category?: string;
}

export const PlaceInfoCard = ({ name, address, category }: PlaceInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {name}
        </CardTitle>
        {category && (
          <CardDescription className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {category}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{address}</p>
      </CardContent>
    </Card>
  );
};
```

#### 3.5. `/src/features/reviews/components/review-form.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RatingInput } from '@/features/reviews/components/rating-input';
import {
  CreateReviewRequestSchema,
  type CreateReviewRequest,
} from '@/features/reviews/lib/dto';

interface ReviewFormProps {
  placeId: string;
  onSubmit: (data: CreateReviewRequest) => void;
  isSubmitting?: boolean;
}

export const ReviewForm = ({ placeId, onSubmit, isSubmitting = false }: ReviewFormProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateReviewRequest>({
    resolver: zodResolver(CreateReviewRequestSchema),
    defaultValues: {
      placeId,
      authorName: '',
      rating: 0,
      content: '',
      password: '',
    },
  });

  const rating = watch('rating');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 작성자명 */}
      <div className="space-y-2">
        <Label htmlFor="authorName">
          작성자명 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="authorName"
          type="text"
          placeholder="예: 맛객"
          {...register('authorName')}
          disabled={isSubmitting}
          aria-invalid={!!errors.authorName}
          aria-describedby={errors.authorName ? 'authorName-error' : undefined}
        />
        {errors.authorName && (
          <p id="authorName-error" className="text-sm text-red-600" role="alert">
            {errors.authorName.message}
          </p>
        )}
      </div>

      {/* 평점 */}
      <div className="space-y-2">
        <Label>
          평점 <span className="text-red-500">*</span>
        </Label>
        <RatingInput
          value={rating}
          onChange={(newRating) => setValue('rating', newRating, { shouldValidate: true })}
          disabled={isSubmitting}
        />
        {errors.rating && (
          <p className="text-sm text-red-600" role="alert">
            {errors.rating.message}
          </p>
        )}
      </div>

      {/* 리뷰 내용 */}
      <div className="space-y-2">
        <Label htmlFor="content">
          리뷰 내용 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="content"
          placeholder="이 장소에 대한 솔직한 리뷰를 작성해주세요."
          rows={6}
          {...register('content')}
          disabled={isSubmitting}
          aria-invalid={!!errors.content}
          aria-describedby={errors.content ? 'content-error' : undefined}
        />
        {errors.content && (
          <p id="content-error" className="text-sm text-red-600" role="alert">
            {errors.content.message}
          </p>
        )}
      </div>

      {/* 비밀번호 */}
      <div className="space-y-2">
        <Label htmlFor="password">
          비밀번호 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="수정/삭제 시 사용할 비밀번호 (최소 4자)"
          {...register('password')}
          disabled={isSubmitting}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-red-600" role="alert">
            {errors.password.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          비밀번호는 리뷰 수정 및 삭제 시 필요하며, 안전하게 암호화되어 저장됩니다.
        </p>
      </div>

      {/* 저장 버튼 */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? '저장 중...' : '리뷰 저장'}
      </Button>
    </form>
  );
};
```

**QA Sheet** (`review-form.qa.md`):
- ✅ 모든 필드 입력 후 저장 버튼 클릭 시 폼 제출
- ✅ 작성자명 미입력 시 "작성자명을 입력하세요" 메시지 표시
- ✅ 평점 미선택 시 "평점은 최소 1점입니다" 메시지 표시
- ✅ 리뷰 내용 미입력 시 "리뷰 내용을 입력하세요" 메시지 표시
- ✅ 비밀번호 4자 미만 시 "비밀번호는 최소 4자 이상이어야 합니다" 메시지 표시
- ✅ 제출 중일 때 모든 입력 필드 및 버튼 비활성화
- ✅ `aria-invalid` 및 `aria-describedby` 속성으로 접근성 지원

---

### Phase 4: 페이지 구현

#### 4.1. `/src/app/write/page.tsx`

```typescript
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlaceInfoCard } from '@/features/reviews/components/place-info-card';
import { ReviewForm } from '@/features/reviews/components/review-form';
import { useCreateReview } from '@/features/reviews/hooks/useCreateReview';
import { useToast } from '@/hooks/use-toast';
import type { CreateReviewRequest } from '@/features/reviews/lib/dto';

export default function WriteReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [placeInfo, setPlaceInfo] = useState<{
    placeId: string;
    name: string;
    address: string;
    category?: string;
  } | null>(null);

  // URL 쿼리 파라미터에서 장소 정보 추출
  useEffect(() => {
    const placeId = searchParams.get('placeId');
    const name = searchParams.get('name');
    const address = searchParams.get('address');
    const category = searchParams.get('category');

    if (!placeId || !name || !address) {
      toast({
        title: '잘못된 접근입니다',
        description: '장소 정보가 올바르지 않습니다.',
        variant: 'destructive',
      });
      router.push('/');
      return;
    }

    setPlaceInfo({
      placeId,
      name,
      address,
      category: category ?? undefined,
    });
  }, [searchParams, router, toast]);

  const { mutate: createReview, isPending } = useCreateReview({
    onSuccess: (data) => {
      toast({
        title: '리뷰가 저장되었습니다',
        description: '작성하신 리뷰가 성공적으로 등록되었습니다.',
      });
      // 장소 상세 페이지로 리다이렉트
      router.push(`/place/${data.placeId}`);
    },
    onError: (error) => {
      toast({
        title: '저장 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: CreateReviewRequest) => {
    createReview(data);
  };

  if (!placeInfo) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">장소 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">리뷰 작성</h1>

      <PlaceInfoCard
        name={placeInfo.name}
        address={placeInfo.address}
        category={placeInfo.category}
      />

      <ReviewForm
        placeId={placeInfo.placeId}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
    </div>
  );
}
```

**QA Sheet** (`write-page.qa.md`):
- ✅ 정상적인 쿼리 파라미터로 접근 시 장소 정보 및 폼 표시
- ✅ `placeId`, `name`, `address` 중 하나라도 없으면 에러 토스트 및 메인 페이지로 리다이렉트
- ✅ 리뷰 저장 성공 시 성공 토스트 표시 및 `/place/[placeId]` 페이지로 이동
- ✅ 리뷰 저장 실패 시 실패 토스트 표시 및 페이지 유지
- ✅ 제출 중일 때 폼 비활성화

---

## 환경 변수 설정

이 기능은 별도의 환경 변수 추가가 필요하지 않습니다. 기존 Supabase 환경 변수만 사용합니다.

---

## 테스트 계획

### 단위 테스트

1. **`password.test.ts`**: 비밀번호 해싱 및 검증 테스트
2. **`service.test.ts`**: 리뷰 생성 서비스 로직 테스트

### 통합 테스트

1. **API 엔드포인트 테스트**: `POST /api/reviews`
   - 정상 리뷰 생성 (201 Created)
   - 요청 바디 유효성 검증 실패 (400 INVALID_REVIEW_DATA)
   - 존재하지 않는 placeId (404 PLACE_NOT_FOUND)
   - 비밀번호 해싱 실패 (500 PASSWORD_HASH_ERROR)
   - 리뷰 저장 실패 (500 REVIEW_CREATE_ERROR)

### E2E 테스트

1. 사용자가 검색 결과에서 "리뷰 작성하기" 클릭 → `/write?placeId=...` 페이지 진입
2. 모든 필드 입력 후 저장 → 리뷰 생성 성공 → `/place/[placeId]` 페이지로 이동
3. 필수 필드 누락 시 유효성 검증 메시지 표시
4. 잘못된 placeId로 접근 시 메인 페이지로 리다이렉트

---

## 구현 순서

1. **Phase 1**: 비밀번호 해싱 유틸리티 구현 (`password.ts`)
2. **Phase 2**: Backend 모듈 구현 (schema, error, service, route, PostgreSQL function, Hono 앱 수정)
3. **Phase 3**: Frontend 모듈 구현 (dto, hooks, components)
4. **Phase 4**: 페이지 구현 (`/write/page.tsx`)
5. **테스트**: 단위 테스트 및 통합 테스트 작성
6. **QA**: UI 테스트 시트 기반 검증

---

## 참고 문서

- Use Case Spec: `/docs/usecases/002/spec.md`
- Database Schema: `/docs/database.md`
- Backend Architecture: `CLAUDE.md` - Backend Layer
- Migration Files: `/supabase/migrations/`

---

## 주의사항

1. **보안**:
   - 비밀번호는 절대 평문으로 저장하지 않으며, bcrypt를 사용하여 해시 처리
   - SALT_ROUNDS는 10으로 설정하여 충분한 보안 강도 확보

2. **에러 처리**:
   - 모든 비즈니스 로직은 `HandlerResult` 패턴으로 에러 처리
   - 사용자 친화적인 에러 메시지 제공
   - 서버 에러는 상세 로깅

3. **트랜잭션**:
   - 리뷰 저장과 장소 통계 갱신은 PostgreSQL Function을 통해 처리
   - 장소 통계 갱신 실패 시에도 리뷰는 저장되고 성공 응답 반환 (로깅만 수행)

4. **접근성**:
   - 모든 입력 필드에 적절한 `aria-*` 속성 추가
   - 에러 메시지는 `role="alert"` 로 스크린 리더에 즉시 전달
   - 키보드 네비게이션 지원

5. **유효성 검증**:
   - 클라이언트(react-hook-form + zod)와 서버(zod) 양쪽에서 이중 검증
   - 모든 검증 규칙은 spec.md의 Business Rules를 준수

6. **리다이렉트**:
   - 리뷰 저장 성공 시 `/place/[placeId]` 페이지로 이동
   - 잘못된 접근 시 메인 페이지로 리다이렉트

---

## 추가 고려사항

### 향후 개선 사항 (MVP 이후)

1. **이미지 업로드**: 리뷰에 사진 첨부 기능 추가
2. **임시 저장**: 작성 중인 리뷰를 로컬 스토리지에 임시 저장
3. **리뷰 수정 프리뷰**: 수정 전/후 비교 뷰 제공
4. **알림 기능**: 리뷰 저장 시 이메일/푸시 알림
5. **스팸 방지**: reCAPTCHA 등을 통한 봇 방지
