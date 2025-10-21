# 리뷰 수정 페이지 - 상태 관리 설계 (Level 1)

## 1. 페이지 정보

- **페이지명**: 리뷰 수정 페이지
- **경로**: `/edit/[reviewId]`
- **복잡도 레벨**: Level 1 (기본 상태만)

### 1.1 복잡도 분석

| 항목 | 점수 | 설명 |
|------|------|------|
| 상태 복잡도 | 3점 | 폼 상태(작성자명, 평점, 내용), 비밀번호 인증 상태, 유효성 에러 |
| 상호작용 복잡도 | 3점 | 리뷰 조회, 폼 수정, API 호출 (인증 + 수정) |
| 컴포넌트 계층 | 2점 | 페이지 > 폼 > 입력 필드들 (단순 구조) |
| 데이터 흐름 | 1점 | 조회 + 수정 (단방향 흐름) |
| **총점** | **9점** | **Level 1** (기본 상태 관리) |

### 1.2 상태 관리 방식

- **react-hook-form**: 폼 상태 및 유효성 검증 관리
- **@tanstack/react-query**: 서버 상태 관리 (리뷰 조회, 수정)
- **로컬 상태**: 로딩, 에러 등 UI 상태
- **Flux 패턴 불필요**: 단순 폼 페이지이므로 Context + useReducer 사용하지 않음

---

## 2. 상태 데이터 식별

### 2.1 관리해야 할 상태 (State)

#### 2.1.1 서버 상태 (React Query)

| 상태명 | 타입 | 설명 | 초기값 |
|--------|------|------|--------|
| `reviewData` | `ReviewData \| undefined` | 조회한 리뷰 데이터 | `undefined` |
| `isLoadingReview` | `boolean` | 리뷰 조회 중 여부 | `true` |
| `reviewError` | `Error \| null` | 리뷰 조회 실패 시 에러 | `null` |
| `isMutating` | `boolean` | 리뷰 수정 요청 중 여부 | `false` |
| `mutationError` | `Error \| null` | 리뷰 수정 실패 시 에러 | `null` |

**타입 정의:**
```typescript
type ReviewData = {
  id: string;
  placeId: string;
  authorName: string;
  rating: number; // 1-5
  content: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};
```

#### 2.1.2 폼 상태 (react-hook-form)

| 상태명 | 타입 | 설명 | 초기값 |
|--------|------|------|--------|
| `authorName` | `string` | 작성자명 | 조회한 데이터의 `authorName` |
| `rating` | `number` | 평점 (1-5) | 조회한 데이터의 `rating` |
| `content` | `string` | 리뷰 내용 | 조회한 데이터의 `content` |

**유효성 규칙:**
```typescript
type ReviewFormData = {
  authorName: string; // 1-50자, 필수
  rating: number;     // 1-5 정수, 필수
  content: string;    // 1-1000자, 필수
};

const validationRules = {
  authorName: {
    required: "작성자명을 입력하세요",
    minLength: { value: 1, message: "작성자명은 최소 1자 이상이어야 합니다" },
    maxLength: { value: 50, message: "작성자명은 최대 50자까지 입력 가능합니다" },
  },
  rating: {
    required: "평점을 선택하세요",
    min: { value: 1, message: "평점은 1 이상이어야 합니다" },
    max: { value: 5, message: "평점은 5 이하여야 합니다" },
  },
  content: {
    required: "리뷰 내용을 입력하세요",
    minLength: { value: 1, message: "리뷰 내용은 최소 1자 이상이어야 합니다" },
    maxLength: { value: 1000, message: "리뷰 내용은 최대 1000자까지 입력 가능합니다" },
  },
};
```

#### 2.1.3 UI 상태 (로컬 상태)

| 상태명 | 타입 | 설명 | 초기값 |
|--------|------|------|--------|
| `showErrorToast` | `boolean` | 에러 토스트 표시 여부 | `false` |
| `errorMessage` | `string` | 사용자에게 표시할 에러 메시지 | `""` |

### 2.2 상태가 아닌 데이터 (Derived State)

화면에 표시되지만 별도로 상태로 관리하지 않는 데이터:

| 데이터명 | 설명 | 계산 방법 |
|----------|------|-----------|
| `isFormValid` | 폼 유효성 여부 | `react-hook-form`의 `formState.isValid` 사용 |
| `isFormDirty` | 폼이 수정되었는지 여부 | `react-hook-form`의 `formState.isDirty` 사용 |
| `fieldErrors` | 각 필드별 유효성 에러 | `react-hook-form`의 `formState.errors` 사용 |
| `contentLength` | 리뷰 내용 현재 글자 수 | `watch('content').length` 로 실시간 계산 |
| `authorNameLength` | 작성자명 현재 글자 수 | `watch('authorName').length` 로 실시간 계산 |
| `isSubmitDisabled` | 제출 버튼 비활성화 여부 | `!isFormValid || isMutating` |
| `placeInfo` | 장소 정보 | URL 파라미터 또는 별도 API 조회 (React Query) |

---

## 3. 상태 전환 테이블

### 3.1 페이지 로드 및 리뷰 조회

| 이벤트 | 조건 | 상태 변경 | 화면 변화 |
|--------|------|-----------|----------|
| 페이지 진입 | `reviewId`가 URL에 존재 | `isLoadingReview = true` | 스켈레톤 UI 또는 로딩 스피너 표시 |
| 리뷰 조회 성공 | API 응답 200 OK | `reviewData = 조회 결과`<br>`isLoadingReview = false` | 폼에 기존 데이터 자동 입력됨<br>(authorName, rating, content) |
| 리뷰 조회 실패 (404) | 리뷰가 존재하지 않음 | `reviewError = Error`<br>`isLoadingReview = false` | "해당 리뷰를 찾을 수 없습니다" 메시지 표시<br>장소 상세 페이지로 리다이렉트 |
| 리뷰 조회 실패 (500) | 서버 오류 | `reviewError = Error`<br>`isLoadingReview = false` | "오류가 발생했습니다. 다시 시도해주세요" 에러 페이지 표시 |

### 3.2 폼 입력 및 유효성 검증

| 이벤트 | 조건 | 상태 변경 | 화면 변화 |
|--------|------|-----------|----------|
| 작성자명 입력 | 사용자가 텍스트 입력 | `authorName = 입력값` | 실시간 문자 수 카운터 업데이트 |
| 작성자명 유효성 실패 | 길이 초과 (50자) | `fieldErrors.authorName = 에러 메시지` | 필드 하단에 "작성자명은 최대 50자까지 입력 가능합니다" 표시 |
| 평점 선택 | 사용자가 별점 클릭 | `rating = 선택한 값 (1-5)` | 별점 UI가 선택한 값으로 업데이트 |
| 리뷰 내용 입력 | 사용자가 텍스트 영역에 입력 | `content = 입력값` | 실시간 문자 수 카운터 업데이트 |
| 리뷰 내용 유효성 실패 | 길이 초과 (1000자) | `fieldErrors.content = 에러 메시지` | 필드 하단에 "리뷰 내용은 최대 1000자까지 입력 가능합니다" 표시 |
| 필수 필드 누락 | 작성자명, 평점, 내용 중 하나라도 비어있음 | `isFormValid = false` | '수정 완료' 버튼 비활성화 (선택 사항) |
| 모든 필드 유효 | 모든 유효성 규칙 통과 | `isFormValid = true` | '수정 완료' 버튼 활성화 |

### 3.3 리뷰 수정 제출

| 이벤트 | 조건 | 상태 변경 | 화면 변화 |
|--------|------|-----------|----------|
| '수정 완료' 버튼 클릭 | `isFormValid = true` | `isMutating = true` | 버튼에 로딩 스피너 표시<br>버튼 비활성화 |
| 수정 요청 성공 (200) | API 응답 성공 | `isMutating = false` | 장소 상세 페이지로 리다이렉트<br>(`/place/[placeId]`) |
| 수정 요청 실패 (400) | 유효성 검증 실패 | `mutationError = Error`<br>`isMutating = false` | 필드별 오류 메시지 표시 |
| 수정 요청 실패 (500) | 서버 오류 | `mutationError = Error`<br>`isMutating = false`<br>`showErrorToast = true` | "저장에 실패했습니다. 잠시 후 다시 시도해주세요" 토스트 표시 |
| 네트워크 오류 | 네트워크 연결 끊김 | `mutationError = Error`<br>`isMutating = false`<br>`showErrorToast = true` | "네트워크 연결을 확인해주세요" 토스트 표시 |

### 3.4 취소 및 뒤로가기

| 이벤트 | 조건 | 상태 변경 | 화면 변화 |
|--------|------|-----------|----------|
| '취소' 버튼 클릭 | 항상 | 없음 (페이지 이탈) | 장소 상세 페이지로 즉시 이동 |
| 브라우저 뒤로가기 | `isFormDirty = true` | 없음 (브라우저 기본 동작) | "변경 사항이 저장되지 않았습니다. 나가시겠습니까?" 경고 표시 (선택 사항) |

---

## 4. 상태 관리 구현 방법

### 4.1 React Query 설정

```typescript
// useReviewQuery.ts
export function useReviewQuery(reviewId: string) {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => fetchReview(reviewId),
    staleTime: 0, // 항상 최신 데이터 조회
    retry: 1,
  });
}

// useUpdateReviewMutation.ts
export function useUpdateReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: ReviewFormData }) =>
      updateReview(reviewId, data),
    onSuccess: (data) => {
      // 리뷰 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['review', data.id] });
      // 장소 상세 페이지의 리뷰 목록 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ['place', data.placeId] });
    },
  });
}
```

### 4.2 react-hook-form 설정

```typescript
// useReviewEditForm.ts
export function useReviewEditForm(reviewData?: ReviewData) {
  const form = useForm<ReviewFormData>({
    mode: 'onChange', // 실시간 유효성 검증
    defaultValues: {
      authorName: reviewData?.authorName || '',
      rating: reviewData?.rating || 1,
      content: reviewData?.content || '',
    },
  });

  // 리뷰 데이터가 로드되면 폼 초기화
  useEffect(() => {
    if (reviewData) {
      form.reset({
        authorName: reviewData.authorName,
        rating: reviewData.rating,
        content: reviewData.content,
      });
    }
  }, [reviewData, form]);

  return form;
}
```

### 4.3 페이지 컴포넌트 구조

```typescript
// /app/edit/[reviewId]/page.tsx
export default async function ReviewEditPage({
  params
}: {
  params: Promise<{ reviewId: string }>
}) {
  const { reviewId } = await params;

  return (
    <ReviewEditPageClient reviewId={reviewId} />
  );
}

// ReviewEditPageClient.tsx
'use client';

function ReviewEditPageClient({ reviewId }: { reviewId: string }) {
  // 1. 리뷰 데이터 조회 (React Query)
  const { data: reviewData, isLoading, error } = useReviewQuery(reviewId);

  // 2. 폼 상태 관리 (react-hook-form)
  const form = useReviewEditForm(reviewData);

  // 3. 수정 뮤테이션 (React Query)
  const { mutate, isPending } = useUpdateReviewMutation();

  // 4. 제출 핸들러
  const onSubmit = form.handleSubmit((data) => {
    mutate(
      { reviewId, data },
      {
        onSuccess: (result) => {
          router.push(`/place/${result.placeId}`);
        },
        onError: (error) => {
          toast.error('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        },
      }
    );
  });

  if (isLoading) return <ReviewEditSkeleton />;
  if (error) return <ErrorPage error={error} />;
  if (!reviewData) return <NotFoundPage />;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <ReviewEditForm />
        <ReviewEditActions isPending={isPending} />
      </form>
    </FormProvider>
  );
}
```

---

## 5. 컴포넌트 계층 및 데이터 흐름

```
┌─────────────────────────────────────┐
│    ReviewEditPage (Server)          │
│    - params 추출                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    ReviewEditPageClient              │
│    - useReviewQuery (조회)           │
│    - useReviewEditForm (폼 관리)     │
│    - useUpdateReviewMutation (수정)  │
└──────────────┬──────────────────────┘
               │
               ├─────────────────────────────┐
               │                             │
               ▼                             ▼
┌──────────────────────┐        ┌──────────────────────┐
│  ReviewEditForm      │        │  ReviewEditActions   │
│  - AuthorNameField   │        │  - SubmitButton      │
│  - RatingField       │        │  - CancelButton      │
│  - ContentField      │        │                      │
└──────────────────────┘        └──────────────────────┘
```

**데이터 흐름:**
1. **하향 (Props)**: `reviewData`, `isLoading`, `isPending` → 자식 컴포넌트
2. **상향 (Callbacks)**: `onSubmit`, `onCancel` ← 자식 컴포넌트
3. **폼 컨텍스트**: `FormProvider`를 통해 모든 하위 컴포넌트가 `useFormContext()` 로 폼 상태 접근

---

## 6. API 호출 명세

### 6.1 리뷰 조회 API

**Endpoint**: `GET /api/reviews/:reviewId`

**Response (Success - 200)**:
```typescript
{
  success: true,
  data: {
    id: string,
    placeId: string,
    authorName: string,
    rating: number,
    content: string,
    createdAt: string,
    updatedAt: string
  }
}
```

### 6.2 리뷰 수정 API

**Endpoint**: `PATCH /api/reviews/:reviewId`

**Request**:
```typescript
{
  authorName: string,  // 1-50자
  rating: number,      // 1-5 정수
  content: string      // 1-1000자
}
```

**Response (Success - 200)**:
```typescript
{
  success: true,
  data: {
    id: string,
    placeId: string,
    authorName: string,
    rating: number,
    content: string,
    updatedAt: string
  }
}
```

---

## 7. 에러 처리 전략

### 7.1 에러 타입별 처리

| 에러 타입 | HTTP 코드 | 처리 방법 |
|-----------|-----------|----------|
| 리뷰 조회 실패 (Not Found) | 404 | "해당 리뷰를 찾을 수 없습니다" 메시지 표시 후 장소 상세 페이지로 리다이렉트 |
| 리뷰 조회 실패 (Server Error) | 500 | 에러 페이지 표시 또는 재시도 버튼 제공 |
| 유효성 검증 실패 | 400 | 필드별 오류 메시지를 해당 필드 하단에 표시 |
| 수정 실패 (Server Error) | 500 | "저장에 실패했습니다. 잠시 후 다시 시도해주세요" 토스트 표시 |
| 네트워크 오류 | - | "네트워크 연결을 확인해주세요" 토스트 표시 |

### 7.2 사용자 피드백

- **로딩 중**: 스켈레톤 UI, 버튼 로딩 스피너
- **성공**: 즉시 리다이렉트 (선택적으로 성공 토스트)
- **실패**: 에러 토스트 또는 인라인 에러 메시지

---

## 8. 성능 최적화

### 8.1 React Query 캐싱 전략

- **리뷰 조회**: `staleTime: 0` (항상 최신 데이터 조회)
- **수정 후 캐시 무효화**: 해당 리뷰 및 장소 상세 페이지 캐시 무효화

### 8.2 폼 최적화

- **debounce**: 문자 수 카운터는 실시간 계산 (debounce 불필요, 단순 계산)
- **validation mode**: `onChange` (실시간 유효성 검증으로 UX 개선)

### 8.3 컴포넌트 최적화

- 필드 컴포넌트는 `React.memo()`로 불필요한 리렌더링 방지 (선택 사항)
- 폼 컨텍스트 사용 시 `useFormContext()` 로 필요한 필드만 구독

---

## 9. 테스트 시나리오

### 9.1 단위 테스트

- [ ] 유효성 검증 로직 테스트 (작성자명, 평점, 내용)
- [ ] 폼 초기화 로직 테스트 (reviewData 변경 시)
- [ ] 제출 핸들러 테스트 (성공/실패 케이스)

### 9.2 통합 테스트

- [ ] 리뷰 조회 성공 시 폼에 데이터 자동 입력
- [ ] 리뷰 수정 성공 시 장소 상세 페이지로 리다이렉트
- [ ] 리뷰 조회 실패 시 에러 메시지 표시

### 9.3 E2E 테스트

- [ ] 장소 상세 페이지 → 수정 버튼 클릭 → 비밀번호 인증 → 리뷰 수정 → 저장 → 장소 상세 페이지로 돌아가기
- [ ] 수정 중 취소 버튼 클릭 시 장소 상세 페이지로 이동
- [ ] 유효성 검증 실패 시 오류 메시지 표시

---

## 10. 구현 체크리스트

### 10.1 필수 기능

- [ ] 리뷰 데이터 조회 API 연동
- [ ] 폼에 기존 데이터 자동 입력
- [ ] 폼 유효성 검증 (react-hook-form)
- [ ] 리뷰 수정 API 연동
- [ ] 수정 성공 시 장소 상세 페이지로 리다이렉트
- [ ] 에러 처리 (조회 실패, 수정 실패)

### 10.2 UX 개선 (선택 사항)

- [ ] 로딩 상태 표시 (스켈레톤 UI)
- [ ] 문자 수 카운터 표시
- [ ] 취소 버튼 클릭 시 변경사항 경고 모달
- [ ] 수정 완료 후 성공 토스트 (선택 사항)

---

## 11. 관련 문서

- `/docs/pages/review-edit/requirement.md` - 페이지 요구사항
- `/docs/usecases/003/spec.md` - UC-003: 기존 리뷰 수정
- `/docs/database.md` - 데이터베이스 스키마
- `/docs/userflow.md` - 유저 플로우 3: 기존 리뷰 수정
