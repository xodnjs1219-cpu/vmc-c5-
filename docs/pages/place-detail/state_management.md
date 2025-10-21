# 장소 상세 페이지 상태 관리 설계 (Place Detail Page)

## 복잡도 분석

- **페이지 경로**: `/place/[placeId]`
- **복잡도 레벨**: Level 2 (Flux 패턴 - useReducer)
- **총 복잡도 점수**: 14점
  - 상태 복잡도: 4점 (장소 정보, 리뷰 목록, 모달 상태, 로딩/에러)
  - 상호작용 복잡도: 4점 (API 호출, 모달 제어, 페이지 이동)
  - 컴포넌트 계층: 3점 (페이지 > 장소 정보/리뷰 목록/모달)
  - 데이터 흐름: 3점 (API 통합, 정렬, 평균 평점 계산)

**선택 이유**: 리뷰 삭제 시 낙관적 업데이트(Optimistic Update), 모달 상태 관리, API 호출 상태 관리 등 복잡한 상태 전환이 필요하므로 useReducer를 통한 Flux 패턴이 적합합니다.

---

## 1. 상태 데이터 식별

### 1.1 관리해야 할 상태 (State)

#### 1) 장소 정보 (placeData)
```typescript
type PlaceData = {
  id: string;
  name: string;
  address: string;
  category: string;
  averageRating: number;
  reviewCount: number;
} | null;
```
- **초기값**: `null`
- **변경 조건**: API 응답 성공 시 설정
- **UI 영향**: 장소 정보 영역 렌더링

#### 2) 리뷰 목록 (reviews)
```typescript
type Review = {
  id: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type ReviewsState = Review[];
```
- **초기값**: `[]`
- **변경 조건**:
  - API 응답 성공 시 설정
  - 리뷰 삭제 성공 시 해당 리뷰 제거
- **UI 영향**: 리뷰 목록 렌더링

#### 3) 로딩 상태 (loadingState)
```typescript
type LoadingState = {
  isPageLoading: boolean;      // 페이지 전체 로딩 (초기 데이터 로드)
  isDeletingReview: boolean;   // 리뷰 삭제 중
  isVerifyingPassword: boolean; // 비밀번호 인증 중
};
```
- **초기값**: `{ isPageLoading: true, isDeletingReview: false, isVerifyingPassword: false }`
- **변경 조건**:
  - API 호출 시작 시 true, 완료/실패 시 false
- **UI 영향**: 로딩 스피너 표시

#### 4) 에러 상태 (errorState)
```typescript
type ErrorState = {
  pageError: string | null;       // 페이지 전체 에러 (장소 정보 로드 실패)
  deleteError: string | null;     // 리뷰 삭제 에러
  passwordError: string | null;   // 비밀번호 인증 에러
};
```
- **초기값**: `{ pageError: null, deleteError: null, passwordError: null }`
- **변경 조건**: API 호출 실패 시 에러 메시지 설정
- **UI 영향**: 에러 메시지 표시

#### 5) 모달 상태 (modalState)
```typescript
type ModalType = 'edit' | 'delete' | null;

type ModalState = {
  isOpen: boolean;
  type: ModalType;
  targetReviewId: string | null;
  passwordInput: string;
};
```
- **초기값**: `{ isOpen: false, type: null, targetReviewId: null, passwordInput: '' }`
- **변경 조건**:
  - 수정/삭제 버튼 클릭 시 모달 오픈 + 타입/리뷰ID 설정
  - 비밀번호 입력 시 passwordInput 업데이트
  - 모달 닫기/인증 성공 시 초기화
- **UI 영향**: 비밀번호 확인 모달 표시

---

### 1.2 화면에 보이지만 상태가 아닌 것 (Derived Values)

#### 1) 리뷰 정렬 순서
- **계산 방법**: `reviews`를 `created_at DESC`로 정렬
- **이유**: API에서 이미 정렬된 데이터를 받아오므로 별도 상태 불필요

#### 2) 리뷰 개수
- **계산 방법**: `reviews.length`
- **이유**: `reviews` 배열의 length로 계산 가능

#### 3) 리뷰 없음 상태
- **계산 방법**: `reviews.length === 0`
- **이유**: 리뷰 목록의 길이로 판단 가능

#### 4) 페이지 로딩 완료 여부
- **계산 방법**: `!loadingState.isPageLoading && placeData !== null`
- **이유**: 로딩 상태와 데이터 존재 여부로 판단

---

## 2. 상태 전환 테이블

| 현재 상태 | 이벤트/액션 | 다음 상태 | 화면 변화 |
|-----------|------------|----------|-----------|
| `isPageLoading: true` | 페이지 진입 시 API 호출 시작 | `isPageLoading: true` | 로딩 스피너 표시 |
| `isPageLoading: true` | API 응답 성공 | `isPageLoading: false`, `placeData` 설정, `reviews` 설정 | 장소 정보 + 리뷰 목록 렌더링 |
| `isPageLoading: true` | API 응답 실패 | `isPageLoading: false`, `pageError` 설정 | 에러 메시지 표시 |
| `modalState.isOpen: false` | 리뷰 '수정' 버튼 클릭 | `modalState: { isOpen: true, type: 'edit', targetReviewId: 'xxx', passwordInput: '' }` | 비밀번호 확인 모달 표시 (수정 모드) |
| `modalState.isOpen: false` | 리뷰 '삭제' 버튼 클릭 | `modalState: { isOpen: true, type: 'delete', targetReviewId: 'xxx', passwordInput: '' }` | 비밀번호 확인 모달 표시 (삭제 모드) |
| `modalState.isOpen: true` | 비밀번호 입력 | `modalState.passwordInput` 업데이트 | 입력 필드 값 변경 |
| `modalState.isOpen: true` | 모달 '확인' 클릭 (수정 모드) | `isVerifyingPassword: true` | 로딩 표시 |
| `isVerifyingPassword: true` | 비밀번호 인증 성공 (수정) | `isVerifyingPassword: false`, 모달 닫기, `/edit/[reviewId]`로 네비게이션 | 페이지 이동 |
| `isVerifyingPassword: true` | 비밀번호 인증 실패 | `isVerifyingPassword: false`, `passwordError` 설정 | "비밀번호가 일치하지 않습니다" 에러 표시 |
| `modalState.isOpen: true` | 모달 '확인' 클릭 (삭제 모드) | `isDeletingReview: true` | 삭제 로딩 표시 |
| `isDeletingReview: true` | 리뷰 삭제 성공 | `isDeletingReview: false`, 모달 닫기, `reviews`에서 해당 리뷰 제거, `placeData.reviewCount` 감소, `placeData.averageRating` 갱신 | 리뷰 목록에서 제거 + 평균 평점 갱신 |
| `isDeletingReview: true` | 리뷰 삭제 실패 (비밀번호 불일치) | `isDeletingReview: false`, `passwordError` 설정 | "비밀번호가 일치하지 않습니다" 에러 표시 |
| `isDeletingReview: true` | 리뷰 삭제 실패 (서버 오류) | `isDeletingReview: false`, `deleteError` 설정 | "삭제 중 오류가 발생했습니다" 에러 표시 |
| `modalState.isOpen: true` | 모달 닫기 (ESC/배경 클릭) | 모달 상태 초기화 | 모달 닫기 |
| `reviews.length > 0` | 마지막 리뷰 삭제 성공 | `reviews: []`, `placeData.reviewCount: 0`, `placeData.averageRating: 0.0` | "아직 작성된 리뷰가 없습니다" 메시지 표시 |

---

## 3. Flux 패턴 설계

### 3.1 Action 정의

```typescript
type Action =
  // 페이지 로딩
  | { type: 'FETCH_PLACE_START' }
  | { type: 'FETCH_PLACE_SUCCESS'; payload: { place: PlaceData; reviews: Review[] } }
  | { type: 'FETCH_PLACE_FAILURE'; payload: { error: string } }

  // 모달 제어
  | { type: 'OPEN_MODAL'; payload: { type: ModalType; reviewId: string } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'UPDATE_PASSWORD_INPUT'; payload: { password: string } }

  // 비밀번호 인증 (수정)
  | { type: 'VERIFY_PASSWORD_START' }
  | { type: 'VERIFY_PASSWORD_SUCCESS' }
  | { type: 'VERIFY_PASSWORD_FAILURE'; payload: { error: string } }

  // 리뷰 삭제
  | { type: 'DELETE_REVIEW_START' }
  | { type: 'DELETE_REVIEW_SUCCESS'; payload: { reviewId: string; updatedPlace: { reviewCount: number; averageRating: number } } }
  | { type: 'DELETE_REVIEW_FAILURE'; payload: { error: string; isPasswordError: boolean } }

  // 에러 초기화
  | { type: 'CLEAR_ERRORS' };
```

---

### 3.2 Reducer 설계

```typescript
type State = {
  placeData: PlaceData;
  reviews: Review[];
  loadingState: LoadingState;
  errorState: ErrorState;
  modalState: ModalState;
};

const initialState: State = {
  placeData: null,
  reviews: [],
  loadingState: {
    isPageLoading: true,
    isDeletingReview: false,
    isVerifyingPassword: false,
  },
  errorState: {
    pageError: null,
    deleteError: null,
    passwordError: null,
  },
  modalState: {
    isOpen: false,
    type: null,
    targetReviewId: null,
    passwordInput: '',
  },
};

function placeDetailReducer(state: State, action: Action): State {
  switch (action.type) {
    // === 페이지 로딩 ===
    case 'FETCH_PLACE_START':
      return {
        ...state,
        loadingState: { ...state.loadingState, isPageLoading: true },
        errorState: { ...state.errorState, pageError: null },
      };

    case 'FETCH_PLACE_SUCCESS':
      return {
        ...state,
        placeData: action.payload.place,
        reviews: action.payload.reviews,
        loadingState: { ...state.loadingState, isPageLoading: false },
      };

    case 'FETCH_PLACE_FAILURE':
      return {
        ...state,
        loadingState: { ...state.loadingState, isPageLoading: false },
        errorState: { ...state.errorState, pageError: action.payload.error },
      };

    // === 모달 제어 ===
    case 'OPEN_MODAL':
      return {
        ...state,
        modalState: {
          isOpen: true,
          type: action.payload.type,
          targetReviewId: action.payload.reviewId,
          passwordInput: '',
        },
        errorState: {
          ...state.errorState,
          passwordError: null,
          deleteError: null,
        },
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modalState: initialState.modalState,
        errorState: {
          ...state.errorState,
          passwordError: null,
          deleteError: null,
        },
      };

    case 'UPDATE_PASSWORD_INPUT':
      return {
        ...state,
        modalState: {
          ...state.modalState,
          passwordInput: action.payload.password,
        },
      };

    // === 비밀번호 인증 (수정) ===
    case 'VERIFY_PASSWORD_START':
      return {
        ...state,
        loadingState: { ...state.loadingState, isVerifyingPassword: true },
        errorState: { ...state.errorState, passwordError: null },
      };

    case 'VERIFY_PASSWORD_SUCCESS':
      return {
        ...state,
        loadingState: { ...state.loadingState, isVerifyingPassword: false },
        modalState: initialState.modalState,
      };

    case 'VERIFY_PASSWORD_FAILURE':
      return {
        ...state,
        loadingState: { ...state.loadingState, isVerifyingPassword: false },
        errorState: { ...state.errorState, passwordError: action.payload.error },
      };

    // === 리뷰 삭제 ===
    case 'DELETE_REVIEW_START':
      return {
        ...state,
        loadingState: { ...state.loadingState, isDeletingReview: true },
        errorState: { ...state.errorState, deleteError: null, passwordError: null },
      };

    case 'DELETE_REVIEW_SUCCESS':
      return {
        ...state,
        reviews: state.reviews.filter((review) => review.id !== action.payload.reviewId),
        placeData: state.placeData
          ? {
              ...state.placeData,
              reviewCount: action.payload.updatedPlace.reviewCount,
              averageRating: action.payload.updatedPlace.averageRating,
            }
          : null,
        loadingState: { ...state.loadingState, isDeletingReview: false },
        modalState: initialState.modalState,
      };

    case 'DELETE_REVIEW_FAILURE':
      return {
        ...state,
        loadingState: { ...state.loadingState, isDeletingReview: false },
        errorState: {
          ...state.errorState,
          passwordError: action.payload.isPasswordError ? action.payload.error : null,
          deleteError: !action.payload.isPasswordError ? action.payload.error : null,
        },
      };

    // === 에러 초기화 ===
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errorState: initialState.errorState,
      };

    default:
      return state;
  }
}
```

---

### 3.3 View 레이어 (Dispatcher)

```typescript
// === 페이지 컴포넌트 ===
function PlaceDetailPage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = use(params);
  const router = useRouter();
  const [state, dispatch] = useReducer(placeDetailReducer, initialState);

  // === 초기 데이터 로딩 ===
  useEffect(() => {
    const fetchPlaceData = async () => {
      dispatch({ type: 'FETCH_PLACE_START' });

      try {
        const response = await fetch(`/api/places/${placeId}`);

        if (!response.ok) {
          throw new Error('장소 정보를 불러오는 데 실패했습니다');
        }

        const data = await response.json();
        dispatch({
          type: 'FETCH_PLACE_SUCCESS',
          payload: { place: data.place, reviews: data.reviews },
        });
      } catch (error) {
        dispatch({
          type: 'FETCH_PLACE_FAILURE',
          payload: { error: error.message },
        });
      }
    };

    fetchPlaceData();
  }, [placeId]);

  // === 모달 제어 함수 ===
  const handleOpenEditModal = (reviewId: string) => {
    dispatch({ type: 'OPEN_MODAL', payload: { type: 'edit', reviewId } });
  };

  const handleOpenDeleteModal = (reviewId: string) => {
    dispatch({ type: 'OPEN_MODAL', payload: { type: 'delete', reviewId } });
  };

  const handleCloseModal = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  };

  const handlePasswordChange = (password: string) => {
    dispatch({ type: 'UPDATE_PASSWORD_INPUT', payload: { password } });
  };

  // === 비밀번호 인증 (수정) ===
  const handleVerifyForEdit = async () => {
    if (!state.modalState.passwordInput) {
      dispatch({
        type: 'VERIFY_PASSWORD_FAILURE',
        payload: { error: '비밀번호를 입력하세요' },
      });
      return;
    }

    dispatch({ type: 'VERIFY_PASSWORD_START' });

    try {
      const response = await fetch(`/api/reviews/${state.modalState.targetReviewId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: state.modalState.passwordInput }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '비밀번호가 일치하지 않습니다');
      }

      dispatch({ type: 'VERIFY_PASSWORD_SUCCESS' });
      router.push(`/edit/${state.modalState.targetReviewId}`);
    } catch (error) {
      dispatch({
        type: 'VERIFY_PASSWORD_FAILURE',
        payload: { error: error.message },
      });
    }
  };

  // === 리뷰 삭제 ===
  const handleDeleteReview = async () => {
    if (!state.modalState.passwordInput) {
      dispatch({
        type: 'DELETE_REVIEW_FAILURE',
        payload: { error: '비밀번호를 입력하세요', isPasswordError: true },
      });
      return;
    }

    dispatch({ type: 'DELETE_REVIEW_START' });

    try {
      const response = await fetch(`/api/reviews/${state.modalState.targetReviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: state.modalState.passwordInput }),
      });

      if (!response.ok) {
        const error = await response.json();
        const isPasswordError = response.status === 401;
        throw new Error(error.message || '삭제에 실패했습니다');
      }

      const data = await response.json();
      dispatch({
        type: 'DELETE_REVIEW_SUCCESS',
        payload: {
          reviewId: state.modalState.targetReviewId!,
          updatedPlace: data.data.updatedPlace,
        },
      });
    } catch (error) {
      const isPasswordError = error.message.includes('비밀번호');
      dispatch({
        type: 'DELETE_REVIEW_FAILURE',
        payload: { error: error.message, isPasswordError },
      });
    }
  };

  // === 모달 확인 버튼 핸들러 ===
  const handleModalConfirm = () => {
    if (state.modalState.type === 'edit') {
      handleVerifyForEdit();
    } else if (state.modalState.type === 'delete') {
      handleDeleteReview();
    }
  };

  // === Derived Values ===
  const hasReviews = state.reviews.length > 0;
  const isPageReady = !state.loadingState.isPageLoading && state.placeData !== null;

  // === 렌더링 ===
  if (state.loadingState.isPageLoading) {
    return <LoadingSpinner />;
  }

  if (state.errorState.pageError) {
    return <ErrorMessage message={state.errorState.pageError} />;
  }

  return (
    <div>
      {/* 장소 정보 영역 */}
      <PlaceInfo place={state.placeData} />

      {/* 리뷰 작성하기 버튼 */}
      <button onClick={() => router.push(`/write?placeId=${placeId}`)}>
        리뷰 작성하기
      </button>

      {/* 리뷰 목록 */}
      {hasReviews ? (
        <ReviewList
          reviews={state.reviews}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
        />
      ) : (
        <div>아직 작성된 리뷰가 없습니다</div>
      )}

      {/* 비밀번호 확인 모달 */}
      <PasswordModal
        isOpen={state.modalState.isOpen}
        type={state.modalState.type}
        password={state.modalState.passwordInput}
        isLoading={state.loadingState.isVerifyingPassword || state.loadingState.isDeletingReview}
        passwordError={state.errorState.passwordError}
        deleteError={state.errorState.deleteError}
        onPasswordChange={handlePasswordChange}
        onConfirm={handleModalConfirm}
        onClose={handleCloseModal}
      />
    </div>
  );
}
```

---

## 4. 데이터 로딩 플로우

### 4.1 초기 로딩 플로우

```
[User]
  ↓ (마커 클릭)
[View: PlaceDetailPage]
  ↓ dispatch(FETCH_PLACE_START)
[Reducer]
  ↓ state.loadingState.isPageLoading = true
[View]
  ↓ useEffect → API 호출
[API: GET /api/places/:placeId]
  ↓
[Backend]
  ↓ DB 조회 (places + reviews)
[API Response]
  ↓ success
[View]
  ↓ dispatch(FETCH_PLACE_SUCCESS, { place, reviews })
[Reducer]
  ↓ state.placeData = place
  ↓ state.reviews = reviews
  ↓ state.loadingState.isPageLoading = false
[View]
  ↓ 리렌더링
[UI]
  ↓ 장소 정보 + 리뷰 목록 표시
```

---

### 4.2 리뷰 삭제 플로우

```
[User]
  ↓ ('삭제' 버튼 클릭)
[View: PlaceDetailPage]
  ↓ handleOpenDeleteModal(reviewId)
  ↓ dispatch(OPEN_MODAL, { type: 'delete', reviewId })
[Reducer]
  ↓ state.modalState = { isOpen: true, type: 'delete', targetReviewId, passwordInput: '' }
[View]
  ↓ 리렌더링
[UI: PasswordModal]
  ↓ 모달 표시 (삭제 모드)
[User]
  ↓ (비밀번호 입력)
[View]
  ↓ handlePasswordChange(password)
  ↓ dispatch(UPDATE_PASSWORD_INPUT, { password })
[Reducer]
  ↓ state.modalState.passwordInput = password
[User]
  ↓ ('확인' 버튼 클릭)
[View]
  ↓ handleDeleteReview()
  ↓ dispatch(DELETE_REVIEW_START)
[Reducer]
  ↓ state.loadingState.isDeletingReview = true
[View]
  ↓ API 호출
[API: DELETE /api/reviews/:reviewId]
  ↓ { password }
[Backend]
  ↓ 비밀번호 검증
  ↓ DB: DELETE FROM reviews
  ↓ DB: UPDATE places (review_count, average_rating)
[API Response]
  ↓ success
[View]
  ↓ dispatch(DELETE_REVIEW_SUCCESS, { reviewId, updatedPlace })
[Reducer]
  ↓ state.reviews = reviews.filter(r => r.id !== reviewId)
  ↓ state.placeData.reviewCount = updatedPlace.reviewCount
  ↓ state.placeData.averageRating = updatedPlace.averageRating
  ↓ state.loadingState.isDeletingReview = false
  ↓ state.modalState = initialState.modalState (모달 닫기)
[View]
  ↓ 리렌더링
[UI]
  ↓ 리뷰 목록에서 해당 리뷰 제거
  ↓ 평균 평점 갱신
  ↓ 모달 닫기
```

---

### 4.3 비밀번호 인증 (수정) 플로우

```
[User]
  ↓ ('수정' 버튼 클릭)
[View]
  ↓ handleOpenEditModal(reviewId)
  ↓ dispatch(OPEN_MODAL, { type: 'edit', reviewId })
[Reducer]
  ↓ state.modalState = { isOpen: true, type: 'edit', targetReviewId, passwordInput: '' }
[UI: PasswordModal]
  ↓ 모달 표시 (수정 모드)
[User]
  ↓ (비밀번호 입력 + '확인' 클릭)
[View]
  ↓ handleVerifyForEdit()
  ↓ dispatch(VERIFY_PASSWORD_START)
[Reducer]
  ↓ state.loadingState.isVerifyingPassword = true
[View]
  ↓ API 호출
[API: POST /api/reviews/:reviewId/verify]
  ↓ { password }
[Backend]
  ↓ DB: 비밀번호 검증
[API Response]
  ↓ success
[View]
  ↓ dispatch(VERIFY_PASSWORD_SUCCESS)
[Reducer]
  ↓ state.loadingState.isVerifyingPassword = false
  ↓ state.modalState = initialState.modalState (모달 닫기)
[View]
  ↓ router.push(/edit/[reviewId])
[UI]
  ↓ 리뷰 수정 페이지로 이동
```

---

## 5. 컴포넌트 구조 및 Props

### 5.1 PlaceDetailPage (부모 컴포넌트)

**역할**: 상태 관리 및 비즈니스 로직 총괄

**사용하는 상태**:
- `state` (전체 상태)
- `dispatch` (액션 디스패치)

**제공하는 함수**:
- `handleOpenEditModal(reviewId: string)`
- `handleOpenDeleteModal(reviewId: string)`
- `handleCloseModal()`
- `handlePasswordChange(password: string)`
- `handleModalConfirm()`

---

### 5.2 PlaceInfo (자식 컴포넌트)

**Props**:
```typescript
type PlaceInfoProps = {
  place: PlaceData | null;
};
```

**역할**: 장소 정보 표시 (이름, 주소, 카테고리, 평균 평점, 리뷰 개수)

---

### 5.3 ReviewList (자식 컴포넌트)

**Props**:
```typescript
type ReviewListProps = {
  reviews: Review[];
  onEdit: (reviewId: string) => void;
  onDelete: (reviewId: string) => void;
};
```

**역할**: 리뷰 목록 렌더링, 각 리뷰의 수정/삭제 버튼 이벤트 위임

---

### 5.4 PasswordModal (자식 컴포넌트)

**Props**:
```typescript
type PasswordModalProps = {
  isOpen: boolean;
  type: ModalType;
  password: string;
  isLoading: boolean;
  passwordError: string | null;
  deleteError: string | null;
  onPasswordChange: (password: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};
```

**역할**:
- 비밀번호 입력 UI 제공
- 수정/삭제 모드 구분 표시
- 에러 메시지 표시
- 확인/닫기 버튼 이벤트 위임

---

## 6. 에러 처리 전략

### 6.1 페이지 로딩 에러
- **에러 타입**: 404 (장소 없음), 500 (서버 오류)
- **처리 방법**: `state.errorState.pageError`에 메시지 저장 → 전체 페이지에 에러 메시지 표시

### 6.2 비밀번호 인증 에러
- **에러 타입**: 401 (비밀번호 불일치), 500 (서버 오류)
- **처리 방법**: `state.errorState.passwordError`에 메시지 저장 → 모달 내 에러 메시지 표시

### 6.3 리뷰 삭제 에러
- **에러 타입**: 401 (비밀번호 불일치), 500 (서버 오류)
- **처리 방법**:
  - 비밀번호 오류: `passwordError`에 저장 → 모달 내 표시
  - 서버 오류: `deleteError`에 저장 → 모달 닫고 스낵바 표시

---

## 7. 최적화 전략

### 7.1 불필요한 리렌더링 방지
- `React.memo`를 사용하여 `ReviewList`, `PlaceInfo` 컴포넌트 메모이제이션
- 이벤트 핸들러는 `useCallback`으로 메모이제이션

### 7.2 API 호출 최적화
- 페이지 진입 시 단일 API 호출로 장소 정보 + 리뷰 목록 동시 로드
- 리뷰 삭제 시 서버에서 갱신된 평균 평점/리뷰 개수를 응답에 포함하여 추가 API 호출 불필요

### 7.3 낙관적 업데이트 (선택적)
- 리뷰 삭제 시 서버 응답 전 UI에서 먼저 제거 (롤백 로직 필요)
- 현재 설계에서는 서버 응답 후 업데이트 (안정성 우선)

---

## 8. 테스트 고려사항

### 8.1 Reducer 단위 테스트
- 각 액션에 대한 상태 전환이 올바른지 검증
- Edge Case: 마지막 리뷰 삭제 시 `reviewCount: 0`, `averageRating: 0.0` 확인

### 8.2 컴포넌트 통합 테스트
- 모달 열기/닫기 동작 확인
- 비밀번호 입력 후 인증 실패 시 에러 메시지 표시 확인
- 리뷰 삭제 후 목록에서 제거 확인

### 8.3 API 모킹 테스트
- MSW를 사용하여 API 응답 모킹
- 성공/실패 시나리오 모두 테스트

---

## 9. 향후 개선 방향

### 9.1 리뷰 페이지네이션
- 리뷰 개수가 많아질 경우 무한 스크롤 또는 페이지네이션 추가
- `reviews` 상태를 `pages` 배열로 관리

### 9.2 리뷰 정렬 옵션
- 최신순/평점순/추천순 정렬 옵션 추가
- `sortOption` 상태 추가 (현재는 최신순 고정)

### 9.3 낙관적 업데이트 도입
- 리뷰 삭제 시 즉시 UI 업데이트 후 서버 요청
- 실패 시 롤백 로직 추가

### 9.4 에러 복구 메커니즘
- 네트워크 오류 시 재시도 버튼 제공
- 자동 재시도 로직 (exponential backoff)

---

## 10. 요약

### 상태 관리 방식
- **Level 2 (Flux 패턴)**: `useReducer` 사용
- **Context 사용 안 함**: 단일 페이지 컴포넌트로 충분

### 핵심 상태
1. `placeData`: 장소 정보
2. `reviews`: 리뷰 목록
3. `loadingState`: 페이지 로딩/삭제 중/인증 중
4. `errorState`: 페이지 에러/비밀번호 에러/삭제 에러
5. `modalState`: 모달 열림/타입/대상 리뷰/비밀번호 입력

### 주요 Action
- `FETCH_PLACE_START/SUCCESS/FAILURE`: 페이지 데이터 로딩
- `OPEN_MODAL/CLOSE_MODAL`: 모달 제어
- `VERIFY_PASSWORD_START/SUCCESS/FAILURE`: 비밀번호 인증
- `DELETE_REVIEW_START/SUCCESS/FAILURE`: 리뷰 삭제

### 데이터 흐름
- **단방향 데이터 흐름**: View → Action → Reducer → State → View
- **API 통합**: 비동기 작업은 View 레이어에서 처리 후 dispatch
- **에러 처리**: 각 작업별 에러 상태 분리 관리
