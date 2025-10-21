# 장소 상세 페이지 요구사항 (Place Detail Page)

## 페이지 정보
- **경로**: `/place/[placeId]`
- **진입 경로**: 메인 페이지 지도 마커 클릭
- **목적**: 특정 장소의 상세 정보와 리뷰 목록을 조회하고, 리뷰 작성/수정/삭제 기능 접근

---

## 1. 페이지 구성 요소

### 1.1 장소 정보 영역
- **가게명**: 장소 이름
- **주소**: 전체 주소
- **업종**: 카테고리 (예: 한식, 중식, 일식 등)
- **평균 평점**: 모든 리뷰 평점의 평균 (소수점 1자리, 0.0~5.0)
- **리뷰 개수**: 총 리뷰 수

### 1.2 액션 버튼
- **리뷰 작성하기 버튼**: 클릭 시 `/write?placeId=[placeId]`로 이동

### 1.3 리뷰 목록 영역
- **정렬 기준**: 최신순 (created_at DESC)
- **각 리뷰 항목 표시 정보**:
  - 작성자명
  - 평점 (1~5점, 별점 UI)
  - 리뷰 내용
  - 작성일시 (created_at)
  - 수정일시 (updated_at, 수정된 경우만 표시)
  - 수정 버튼
  - 삭제 버튼

---

## 2. 사용자 행동 및 데이터 흐름

### 2.1 페이지 진입 시 (초기 로딩)

#### 사용자 행동
1. 메인 페이지에서 지도 마커 클릭
2. `/place/[placeId]` 페이지로 이동

#### 시스템 처리 흐름
1. **placeId 추출**: URL 파라미터에서 placeId 추출
2. **API 요청**: `GET /api/places/:placeId` 호출
3. **DB 조회**:
   - `places` 테이블에서 장소 정보 조회
   - `reviews` 테이블에서 해당 place_id의 모든 리뷰 조회 (최신순 정렬)
4. **데이터 반환**:
   ```typescript
   {
     place: {
       id: string;
       name: string;
       address: string;
       category: string;
       averageRating: number;  // 평균 평점
       reviewCount: number;    // 리뷰 개수
     };
     reviews: Array<{
       id: string;
       authorName: string;
       rating: number;
       content: string;
       createdAt: string;
       updatedAt: string;
     }>;
   }
   ```
5. **UI 렌더링**: 장소 정보 + 리뷰 목록 표시

#### 데이터 상태
- **로딩 상태**: API 호출 중 로딩 스피너 표시
- **성공 상태**: 데이터 렌더링
- **에러 상태**: 에러 메시지 표시

---

### 2.2 리뷰 작성하기 버튼 클릭

#### 사용자 행동
- '리뷰 작성하기' 버튼 클릭

#### 시스템 처리 흐름
1. `/write?placeId=[placeId]` 페이지로 네비게이션
2. 장소 정보를 query parameter로 전달

#### 데이터 변화
- 페이지 전환, 상태 변화 없음

---

### 2.3 리뷰 수정 버튼 클릭

#### 사용자 행동
1. 특정 리뷰의 '수정' 버튼 클릭
2. 비밀번호 확인 모달에 비밀번호 입력
3. '확인' 버튼 클릭

#### 시스템 처리 흐름
1. **모달 표시**: 비밀번호 입력 모달 오픈
2. **비밀번호 인증 API 요청**: `POST /api/reviews/:reviewId/verify`
   - Request Body: `{ password: string }`
3. **DB 조회**:
   - `reviews` 테이블에서 해당 reviewId의 password_hash 조회
   - 입력된 비밀번호를 해시 처리하여 DB의 해시값과 비교
4. **인증 결과 처리**:
   - **성공**:
     - 모달 닫기
     - `/edit/[reviewId]` 페이지로 이동
   - **실패**:
     - 모달 유지
     - "비밀번호가 일치하지 않습니다" 에러 메시지 표시

#### 모달 상태
- **모달 열림 상태**: true/false
- **선택된 리뷰 ID**: reviewId 저장
- **비밀번호 입력값**: password 문자열
- **인증 로딩 상태**: 인증 API 호출 중 표시
- **인증 에러 메시지**: 인증 실패 시 에러 메시지

---

### 2.4 리뷰 삭제 버튼 클릭

#### 사용자 행동
1. 특정 리뷰의 '삭제' 버튼 클릭
2. 비밀번호 확인 모달에 비밀번호 입력
3. '확인' 버튼 클릭

#### 시스템 처리 흐름
1. **모달 표시**: 비밀번호 입력 모달 오픈 (삭제 작업임을 명시)
2. **비밀번호 인증 + 삭제 API 요청**: `DELETE /api/reviews/:reviewId`
   - Request Body: `{ password: string }`
3. **DB 트랜잭션**:
   ```sql
   BEGIN;

   -- 1. 비밀번호 검증
   SELECT password_hash, place_id FROM reviews WHERE id = :reviewId;

   -- 2. 리뷰 삭제
   DELETE FROM reviews WHERE id = :reviewId RETURNING place_id;

   -- 3. 장소 정보 갱신
   UPDATE places
   SET
     review_count = (SELECT COUNT(*) FROM reviews WHERE place_id = :placeId),
     average_rating = COALESCE(
       (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE place_id = :placeId),
       0.0
     ),
     updated_at = NOW()
   WHERE id = :placeId
   RETURNING review_count, average_rating;

   COMMIT;
   ```
4. **삭제 결과 처리**:
   - **성공**:
     - 모달 닫기
     - 리뷰 목록에서 해당 리뷰 제거
     - 평균 평점 갱신
     - "리뷰가 삭제되었습니다" 토스트 메시지 표시 (선택)
   - **실패**:
     - 모달 유지
     - "비밀번호가 일치하지 않습니다" 또는 "삭제 중 오류가 발생했습니다" 에러 메시지 표시

#### 데이터 변화
- **리뷰 목록**: 해당 리뷰 항목 제거
- **평균 평점**: 재계산된 값으로 갱신
- **리뷰 개수**: 1 감소
- **(마지막 리뷰 삭제 시)**:
  - review_count = 0
  - average_rating = 0.0
  - 메인 페이지 지도에서 마커 제거

---

## 3. Edge Cases

### 3.1 유효하지 않은 placeId
- **상황**: URL의 placeId가 유효하지 않거나 DB에 존재하지 않음
- **처리**: "존재하지 않는 장소입니다" 에러 페이지 또는 메시지 표시

### 3.2 API 로딩 실패
- **상황**: 네트워크 오류, 서버 오류 (5xx)
- **처리**: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요" 에러 메시지 표시

### 3.3 리뷰가 없는 장소
- **상황**: 장소는 존재하지만 review_count = 0 (정상적으로는 발생하지 않음)
- **처리**: 장소 정보는 표시하되, "아직 작성된 리뷰가 없습니다" 메시지 표시

### 3.4 비밀번호 미입력
- **상황**: 모달에서 비밀번호를 입력하지 않고 '확인' 클릭
- **처리**: "비밀번호를 입력하세요" 유효성 오류 메시지 표시

### 3.5 비밀번호 불일치
- **상황**: 입력한 비밀번호가 DB의 해시값과 일치하지 않음
- **처리**: "비밀번호가 일치하지 않습니다" 에러 메시지 표시

### 3.6 마지막 리뷰 삭제
- **상황**: 삭제하려는 리뷰가 해당 장소의 유일한 리뷰
- **처리**:
  - 삭제 성공
  - 평균 평점 0.0으로 갱신
  - "아직 작성된 리뷰가 없습니다" 상태로 전환
  - 메인 페이지 지도에서 마커 자동 제거

---

## 4. DB 상호작용

### 4.1 사용 테이블

#### places 테이블
```sql
CREATE TABLE places (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  average_rating NUMERIC(2, 1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### reviews 테이블
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reviews_place_id ON reviews(place_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
```

### 4.2 주요 쿼리

#### 장소 정보 조회
```sql
SELECT
  id,
  name,
  address,
  category,
  average_rating,
  review_count
FROM places
WHERE id = $1;
```

#### 리뷰 목록 조회 (최신순)
```sql
SELECT
  id,
  author_name,
  rating,
  content,
  created_at,
  updated_at
FROM reviews
WHERE place_id = $1
ORDER BY created_at DESC;
```

#### 비밀번호 인증
```sql
SELECT password_hash
FROM reviews
WHERE id = $1;

-- 애플리케이션 레벨에서 bcrypt.compare(입력비밀번호, password_hash) 검증
```

#### 리뷰 삭제 + 장소 정보 갱신 (트랜잭션)
```sql
BEGIN;

-- 리뷰 삭제
DELETE FROM reviews
WHERE id = $1
RETURNING place_id;

-- 장소 정보 갱신
UPDATE places
SET
  review_count = (SELECT COUNT(*) FROM reviews WHERE place_id = $2),
  average_rating = COALESCE(
    (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE place_id = $2),
    0.0
  ),
  updated_at = NOW()
WHERE id = $2
RETURNING review_count, average_rating;

COMMIT;
```

---

## 5. 관련 유스케이스

- **UC-005**: 장소 상세 정보 조회 (지도 마커 경유)
- **UC-003**: 기존 리뷰 수정
- **UC-004**: 기존 리뷰 삭제
- **UC-002**: 신규 리뷰 작성 및 저장 (리뷰 작성하기 버튼)

---

## 6. 비기능 요구사항

### 6.1 성능
- 장소 정보 + 리뷰 목록 조회는 단일 API 호출로 처리
- 리뷰 목록은 페이지네이션 없이 전체 조회 (초기 버전)
- 리뷰 개수가 많아질 경우 무한 스크롤 또는 페이지네이션 추가 고려

### 6.2 보안
- 비밀번호는 절대 평문으로 저장하지 않음 (bcrypt 해시 사용)
- API 요청 시 비밀번호는 HTTPS를 통해 전송
- SQL Injection 방지를 위해 파라미터 바인딩 사용

### 6.3 사용성
- 로딩 중 스피너 표시로 사용자에게 피드백 제공
- 에러 발생 시 명확한 에러 메시지 표시
- 모달 닫기는 ESC 키, 배경 클릭으로도 가능
- 비밀번호 입력 필드는 type="password"로 마스킹

### 6.4 접근성
- 장소 정보는 SSR 가능 (SEO 고려)
- 리뷰 목록은 semantic HTML 사용
- 키보드 네비게이션 지원
- 스크린 리더 호환성 고려
