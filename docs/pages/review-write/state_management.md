# 리뷰 작성 페이지 - 상태 관리 설계

## 복잡도 분석

- **상태 복잡도**: 3점 (폼 상태, 장소 정보, 유효성 에러)
- **상호작용 복잡도**: 2점 (폼 입력, API 호출)
- **컴포넌트 계층**: 2점 (Page → Form → InputFields)
- **데이터 흐름**: 1점 (간단한 폼 제출)

**총점: 8점 → Level 1 (기본 상태만)**

## 상태 관리 전략

Level 1 복잡도에 해당하므로 다음과 같은 기본 상태 관리 전략을 사용합니다:

- **react-hook-form**: 폼 상태 및 유효성 검증 관리
- **@tanstack/react-query**: 서버 상태 관리 (장소 정보 조회, 리뷰 작성 API)
- **useState**: 로딩 상태 등 간단한 UI 상태 관리
- **Flux 패턴 / Context API**: 사용하지 않음 (복잡도가 낮아 불필요)

---

## 1. 상태 데이터 식별

### 1.1. 관리해야 할 상태 (State)

#### A. 폼 상태 (react-hook-form)

폼의 입력 데이터를 관리하는 상태로, react-hook-form의 `useForm` 훅을 통해 관리됩니다.

```typescript
interface ReviewFormData {
  authorName: string;    // 작성자명
  rating: number | null; // 평점 (1~5)
  content: string;       // 리뷰 내용
  password: string;      // 비밀번호
}
```

**초기값:**
```typescript
{
  authorName: "",
  rating: null,
  content: "",
  password: ""
}
```

**관리 방법:**
- `react-hook-form`의 `register`, `setValue`, `getValues` 사용
- 실시간 유효성 검증은 `mode: "onBlur"` 또는 `mode: "onChange"`

#### B. 장소 정보 상태 (React Query)

페이지 상단에 표시할 장소 기본 정보입니다.

```typescript
interface PlaceInfo {
  id: string;        // UUID
  name: string;      // 가게명
  address: string;   // 주소
  category: string;  // 업종
}
```

**데이터 소스:**
- URL 파라미터 `placeId`를 기반으로 API 조회
- `useQuery`를 통해 서버 상태로 관리

**Query Key:**
```typescript
['place', placeId]
```

#### C. 제출 상태 (React Query Mutation)

리뷰 제출 중인지 여부를 나타내는 상태입니다.

```typescript
interface SubmissionState {
  isLoading: boolean;     // 제출 중 여부
  isSuccess: boolean;     // 제출 성공 여부
  isError: boolean;       // 제출 실패 여부
  error: Error | null;    // 에러 객체
}
```

**관리 방법:**
- `useMutation`의 반환값 사용
- `isLoading`, `isSuccess`, `isError` 상태를 UI에 반영

### 1.2. 파생 데이터 (Derived State)

상태가 아닌, 기존 상태로부터 계산되는 데이터입니다.

#### A. 폼 유효성 상태

```typescript
const isFormValid = !!(
  formState.isValid &&
  watch('authorName') &&
  watch('rating') &&
  watch('content') &&
  watch('password')
);
```

**계산 방법:**
- react-hook-form의 `formState.isValid` 활용
- 모든 필수 필드가 채워졌는지 검증

#### B. 에러 메시지

```typescript
const errorMessages = {
  authorName: formState.errors.authorName?.message,
  rating: formState.errors.rating?.message,
  content: formState.errors.content?.message,
  password: formState.errors.password?.message,
};
```

**계산 방법:**
- react-hook-form의 `formState.errors` 객체에서 추출

#### C. 제출 버튼 비활성화 여부

```typescript
const isSubmitDisabled = !isFormValid || mutation.isLoading;
```

**계산 방법:**
- 폼이 유효하지 않거나, 제출 중일 때 버튼 비활성화

### 1.3. 화면에 보여지지만 상태가 아닌 데이터

#### A. 정적 레이블 및 플레이스홀더
- 입력 필드의 라벨: "작성자명", "평점", "리뷰 내용", "비밀번호"
- 플레이스홀더: "닉네임을 입력하세요", "방문 경험을 공유해주세요"

#### B. 안내 문구
- 비밀번호 필드 하단: "이 비밀번호는 나중에 리뷰를 수정하거나 삭제할 때 필요합니다"

#### C. URL 파라미터
- `placeId`: URL에서 추출하여 API 요청에 사용하지만, 별도 상태로 관리하지 않음
- `useSearchParams` 또는 `useRouter`로 직접 접근

---

## 2. 상태 전환 테이블

### 2.1. 페이지 진입 (초기 로딩)

| 상태 | 이전 값 | 이후 값 | 트리거 | 화면 변화 |
|-----|--------|--------|-------|----------|
| `placeInfo` | `undefined` | `{ id, name, address, category }` | useQuery 성공 | 장소 정보 섹션에 데이터 표시 |
| `placeInfo` | `undefined` | `error` | useQuery 실패 | 에러 메시지 표시 또는 리다이렉트 |
| `formData` | 초기값 | 초기값 | - | 빈 폼 렌더링 |

**화면 상태:**
- 로딩 중: 장소 정보 스켈레톤 표시
- 성공: 장소명, 주소, 업종 표시 + 폼 활성화
- 실패: 에러 메시지 표시 또는 메인 페이지로 리다이렉트

### 2.2. 폼 입력 (사용자 타이핑)

| 상태 | 이전 값 | 이후 값 | 트리거 | 화면 변화 |
|-----|--------|--------|-------|----------|
| `authorName` | `""` | `"맛객"` | 사용자 입력 | 입력 필드에 텍스트 표시 |
| `rating` | `null` | `5` | 별점 클릭 | 5개의 별이 채워진 상태로 표시 |
| `content` | `""` | `"정말 맛있어요!"` | 사용자 입력 | 텍스트 영역에 내용 표시 |
| `password` | `""` | `"1234"` | 사용자 입력 | 마스킹된 비밀번호 표시 (`****`) |
| `formState.isValid` | `false` | `true` | 모든 필드 유효 | 저장 버튼 활성화 |

**화면 상태:**
- 각 필드 입력 시: 실시간으로 값 반영
- 유효성 검증 통과: 저장 버튼 활성화
- 유효성 검증 실패: 필드 하단에 에러 메시지 표시

### 2.3. 유효성 검증 실패 (onBlur)

| 상태 | 이전 값 | 이후 값 | 트리거 | 화면 변화 |
|-----|--------|--------|-------|----------|
| `errors.authorName` | `undefined` | `{ message: "작성자명을 입력하세요" }` | 빈 필드에서 포커스 이탈 | 필드 하단에 빨간색 에러 메시지 |
| `errors.rating` | `undefined` | `{ message: "평점을 선택해주세요" }` | 평점 미선택 상태에서 제출 | 별점 영역 하단에 에러 메시지 |
| `errors.password` | `undefined` | `{ message: "비밀번호는 최소 4자 이상이어야 합니다" }` | 4자 미만 입력 후 포커스 이탈 | 필드 하단에 에러 메시지 |

**화면 상태:**
- 에러가 있는 필드: 빨간색 테두리 + 하단에 에러 메시지
- 저장 버튼: 비활성화 상태 유지

### 2.4. 폼 제출 시작

| 상태 | 이전 값 | 이후 값 | 트리거 | 화면 변화 |
|-----|--------|--------|-------|----------|
| `mutation.isLoading` | `false` | `true` | 저장 버튼 클릭 | 버튼에 로딩 스피너 표시, 버튼 비활성화 |
| `formFields` | 활성화 | 비활성화 (선택사항) | API 요청 시작 | 모든 입력 필드 비활성화 (중복 입력 방지) |

**화면 상태:**
- 저장 버튼: "저장 중..." 텍스트 + 스피너
- 폼 전체: `aria-busy="true"` 속성 추가
- 사용자는 폼과 상호작용 불가

### 2.5. 폼 제출 성공

| 상태 | 이전 값 | 이후 값 | 트리거 | 화면 변화 |
|-----|--------|--------|-------|----------|
| `mutation.isLoading` | `true` | `false` | API 응답 성공 (201) | 로딩 스피너 사라짐 |
| `mutation.isSuccess` | `false` | `true` | API 응답 성공 | 성공 토스트 표시 |
| `navigation` | `/write` | `/place/[placeId]` | `onSuccess` 콜백 | 장소 상세 페이지로 리다이렉트 |

**화면 상태:**
- 성공 토스트: "리뷰가 성공적으로 저장되었습니다" (1-2초 표시)
- 리다이렉트: 해당 장소의 상세 페이지로 자동 이동
- 새 리뷰가 목록 최상단에 표시됨 (장소 상세 페이지에서)

### 2.6. 폼 제출 실패

| 상태 | 이전 값 | 이후 값 | 트리거 | 화면 변화 |
|-----|--------|--------|-------|----------|
| `mutation.isLoading` | `true` | `false` | API 응답 실패 | 로딩 스피너 사라짐 |
| `mutation.isError` | `false` | `true` | API 응답 실패 | 에러 상태 활성화 |
| `mutation.error` | `null` | `Error 객체` | API 응답 실패 | 에러 내용 저장 |

**화면 상태 (HTTP 상태 코드별):**

#### 400 Bad Request (유효성 검증 실패)
- 서버에서 반환한 필드별 에러를 각 입력 필드 하단에 표시
- 예: `{ "authorName": { "_errors": ["Required"] } }`

#### 404 Not Found (장소 없음)
- 에러 스낵바: "잘못된 접근입니다"
- 3초 후 메인 페이지로 자동 리다이렉트

#### 500 Internal Server Error
- 에러 스낵바: "저장에 실패했습니다. 잠시 후 다시 시도해주세요"
- 폼은 유지되며 사용자가 재시도 가능

#### 네트워크 오류
- 에러 스낵바: "네트워크 연결을 확인해주세요"
- 폼은 유지되며 사용자가 재시도 가능

---

## 3. 데이터 흐름 다이어그램

```
[사용자 입력]
    ↓
[react-hook-form]
    ↓
[실시간 유효성 검증]
    ↓
[저장 버튼 클릭]
    ↓
[useMutation 실행]
    ↓
[POST /api/reviews]
    ↓
  ┌─── 성공 (201) ───→ [리다이렉트: /place/[placeId]]
  │
  └─── 실패 (4xx/5xx) ───→ [에러 메시지 표시] → [폼 유지]
```

---

## 4. React Query 설정

### 4.1. 장소 정보 조회

```typescript
const { data: placeInfo, isLoading, isError } = useQuery({
  queryKey: ['place', placeId],
  queryFn: () => fetchPlaceInfo(placeId),
  enabled: !!placeId, // placeId가 있을 때만 쿼리 실행
  staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  retry: 1, // 실패 시 1회 재시도
});
```

### 4.2. 리뷰 작성 (Mutation)

```typescript
const mutation = useMutation({
  mutationFn: (data: ReviewFormData) => createReview({ ...data, placeId }),
  onSuccess: (response) => {
    // 성공 토스트 표시
    toast.success('리뷰가 성공적으로 저장되었습니다');

    // 장소 상세 페이지의 리뷰 목록 캐시 무효화
    queryClient.invalidateQueries({ queryKey: ['reviews', placeId] });
    queryClient.invalidateQueries({ queryKey: ['place', placeId] });

    // 장소 상세 페이지로 리다이렉트
    router.push(`/place/${placeId}`);
  },
  onError: (error) => {
    // 에러 타입별 처리
    if (error.status === 404) {
      toast.error('잘못된 접근입니다');
      setTimeout(() => router.push('/'), 3000);
    } else if (error.status === 400) {
      // 서버 유효성 에러를 react-hook-form에 설정
      const fieldErrors = error.data?.details;
      Object.keys(fieldErrors).forEach((field) => {
        setError(field, { message: fieldErrors[field]._errors[0] });
      });
    } else {
      toast.error('저장에 실패했습니다. 잠시 후 다시 시도해주세요');
    }
  },
});
```

---

## 5. react-hook-form 스키마 정의 (Zod)

```typescript
import { z } from 'zod';

export const reviewFormSchema = z.object({
  authorName: z
    .string()
    .min(1, '작성자명을 입력하세요')
    .max(50, '작성자명은 최대 50자까지 입력 가능합니다'),

  rating: z
    .number({ required_error: '평점을 선택해주세요' })
    .int()
    .min(1, '평점은 1점 이상이어야 합니다')
    .max(5, '평점은 5점 이하여야 합니다'),

  content: z
    .string()
    .min(1, '리뷰 내용을 입력하세요')
    .max(1000, '리뷰 내용은 최대 1000자까지 입력 가능합니다'),

  password: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(100, '비밀번호는 최대 100자까지 입력 가능합니다'),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;
```

---

## 6. 컴포넌트 구조

```
/app/write/page.tsx (Client Component)
  └─ <ReviewWritePage>
      ├─ <PlaceInfoSection>        // 장소 정보 표시
      │   └─ useQuery(['place', placeId])
      │
      └─ <ReviewForm>               // 폼 컴포넌트
          ├─ useForm<ReviewFormData>()
          ├─ useMutation(createReview)
          │
          ├─ <FormField name="authorName">
          │   └─ <Input />
          │
          ├─ <FormField name="rating">
          │   └─ <StarRating />
          │
          ├─ <FormField name="content">
          │   └─ <Textarea />
          │
          ├─ <FormField name="password">
          │   └─ <Input type="password" />
          │
          └─ <Button type="submit">
              └─ {mutation.isLoading ? '저장 중...' : '저장'}
```

---

## 7. 주요 훅 및 API

### 7.1. 페이지 컴포넌트에서 사용할 훅

```typescript
// URL 파라미터 추출
const searchParams = useSearchParams();
const placeId = searchParams.get('placeId');

// 라우터
const router = useRouter();

// 장소 정보 조회
const { data: placeInfo, isLoading: isLoadingPlace } = useQuery({...});

// 폼 관리
const form = useForm<ReviewFormData>({
  resolver: zodResolver(reviewFormSchema),
  mode: 'onBlur',
  defaultValues: {
    authorName: '',
    rating: null,
    content: '',
    password: '',
  },
});

// 리뷰 제출
const mutation = useMutation({...});

// 폼 제출 핸들러
const onSubmit = form.handleSubmit((data) => {
  mutation.mutate(data);
});
```

### 7.2. 노출할 데이터 및 함수

**페이지 컴포넌트에서 하위 컴포넌트로 전달:**

```typescript
// PlaceInfoSection 컴포넌트로 전달
<PlaceInfoSection
  placeInfo={placeInfo}
  isLoading={isLoadingPlace}
/>

// ReviewForm 컴포넌트로 전달
<ReviewForm
  form={form}                     // react-hook-form 인스턴스
  onSubmit={onSubmit}             // 제출 핸들러
  isSubmitting={mutation.isLoading}  // 제출 중 여부
/>
```

---

## 8. 권장사항

### 8.1. 사용 라이브러리

- **react-hook-form**: 폼 상태 관리 및 유효성 검증
- **zod**: 스키마 기반 유효성 검증
- **@tanstack/react-query**: 서버 상태 관리
- **react-hot-toast** 또는 **sonner**: 토스트/스낵바 알림

### 8.2. 성능 최적화

- `useForm`의 `mode: 'onBlur'`로 불필요한 리렌더링 방지
- React Query의 `staleTime` 설정으로 장소 정보 캐싱
- 중복 제출 방지: `mutation.isLoading` 상태로 버튼 비활성화

### 8.3. 사용자 경험 개선

- 입력 중 실시간 글자 수 표시 (선택사항)
- 저장 성공 시 낙관적 UI 업데이트 (선택사항)
- 페이지 이탈 시 미저장 데이터 경고 (선택사항)

---

## 9. 요약

리뷰 작성 페이지는 **Level 1 복잡도**에 해당하므로, 다음과 같은 간단한 상태 관리 전략을 사용합니다:

1. **폼 상태**: `react-hook-form` + `zod`로 관리
2. **서버 상태**: `@tanstack/react-query`로 관리
3. **UI 상태**: 최소한의 `useState` (필요 시)
4. **Context / Flux 패턴**: 불필요 (복잡도가 낮음)

이 접근 방식은 유지보수성과 성능을 모두 확보하면서도 과도한 추상화를 피할 수 있습니다.
